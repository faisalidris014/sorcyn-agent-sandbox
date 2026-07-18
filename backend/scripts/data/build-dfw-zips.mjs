/**
 * Build the committed DFW zip-centroid dataset used by seed-cold-start.ts (#207).
 *
 * Source: US Census ZCTA5 Gazetteer (PUBLIC DOMAIN).
 *   https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
 *
 * ⚠️  ZCTAs are statistical approximations of USPS ZIP Codes — they are NOT
 *     identical to USPS ZIP Codes. This dataset is for SEED-POST GEO PLACEMENT
 *     ONLY (dropping fake demand at plausible map points so sellers' radius
 *     filters surface them). It MUST NOT be used for shipping rates, address
 *     validation, or any USPS-fidelity flow.
 *
 * Centroids come straight from the Gazetteer (INTPTLAT/INTPTLONG). City is the
 * nearest major DFW city by centroid distance — a display label only, not an
 * authoritative ZIP↔city mapping.
 *
 * Reproduce (the Gazetteer ships as a zipped tab-delimited .txt):
 *   curl -sL -o /tmp/zcta.zip \
 *     https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip
 *   unzip -o /tmp/zcta.zip -d /tmp
 *   node scripts/data/build-dfw-zips.mjs /tmp/2023_Gaz_zcta_national.txt
 *
 * Writes scripts/data/dfw-zips.json. Re-run only to refresh from a newer Gazetteer.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_YEAR = 2023;
// DFW metroplex bounding box (TX). Tuned for ~370 ZCTAs across the MSA.
const BBOX = { latMin: 32.05, latMax: 33.95, lngMin: -98.15, lngMax: -95.75 };

// Major DFW cities (centroids) for nearest-city display labelling.
const CITIES = [
  ['Dallas', 32.7767, -96.7970], ['Fort Worth', 32.7555, -97.3308], ['Arlington', 32.7357, -97.1081],
  ['Plano', 33.0198, -96.6989], ['Irving', 32.8140, -96.9489], ['Garland', 32.9126, -96.6389],
  ['Frisco', 33.1507, -96.8236], ['McKinney', 33.1972, -96.6398], ['Denton', 33.2148, -97.1331],
  ['Mesquite', 32.7668, -96.5992], ['Carrollton', 32.9756, -96.8900], ['Richardson', 32.9483, -96.7299],
  ['Lewisville', 33.0462, -96.9942], ['Allen', 33.1031, -96.6706], ['Flower Mound', 33.0146, -97.0970],
  ['Grand Prairie', 32.7459, -96.9978], ['Grapevine', 32.9343, -97.0781], ['Mansfield', 32.5632, -97.1417],
  ['Rockwall', 32.9312, -96.4597], ['Cleburne', 32.3476, -97.3867], ['Waxahachie', 32.3865, -96.8483],
  ['Burleson', 32.5421, -97.3208], ['Keller', 32.9346, -97.2289], ['Wylie', 33.0151, -96.5388],
  ['Rowlett', 32.9029, -96.5638], ['DeSoto', 32.5896, -96.8570], ['Cedar Hill', 32.5885, -96.9561],
];

const dist2 = (la, lo, lb, ob) => (la - lb) ** 2 + (lo - ob) ** 2;
const nearestCity = (la, lo) =>
  CITIES.reduce((best, c) => (dist2(la, lo, c[1], c[2]) < best[1] ? [c[0], dist2(la, lo, c[1], c[2])] : best), ['', Infinity])[0];

const src = process.argv[2];
if (!src) {
  console.error('Usage: node build-dfw-zips.mjs <path-to-Gaz_zcta_national.txt>');
  process.exit(1);
}

const lines = readFileSync(src, 'utf8').split('\n').slice(1);
const zips = [];
for (const ln of lines) {
  if (!ln.trim()) continue;
  const f = ln.split('\t');
  const zip = f[0].trim();
  const lat = parseFloat(f[5]);
  const lng = parseFloat(f[6]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  // DFW ZIPs are 75xxx / 76xxx. The bbox alone leaks cross-border Oklahoma
  // (73xxx/74xxx) and far-east/south TX ZCTAs near the edges; restrict to the
  // DFW prefixes so placement stays inside the metroplex.
  if (!/^7[56]\d{3}$/.test(zip)) continue;
  if (lat >= BBOX.latMin && lat <= BBOX.latMax && lng >= BBOX.lngMin && lng <= BBOX.lngMax) {
    zips.push({ zip, lat: +lat.toFixed(6), lng: +lng.toFixed(6), city: nearestCity(lat, lng) });
  }
}
zips.sort((a, b) => a.zip.localeCompare(b.zip));

const out = {
  _meta: {
    source: `US Census ${SOURCE_YEAR} ZCTA5 Gazetteer (public domain)`,
    warning:
      'ZCTAs approximate but are NOT identical to USPS ZIP Codes. Seed-post geo placement ONLY — do not use for shipping, address validation, or any USPS-fidelity flow.',
    boundingBox: BBOX,
    cityLabel: 'nearest major DFW city by centroid distance (display only)',
    count: zips.length,
  },
  zips,
};
const dest = new URL('./dfw-zips.json', import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${zips.length} DFW zips -> scripts/data/dfw-zips.json`);
