import { describe, it, expect } from 'vitest';
import {
  TdlrProvider,
  parseTdlrExpiration,
  type FetchFn,
} from '../src/modules/sellers/providers/tdlr-provider.js';

const FUTURE = '12312099'; // MMDDYYYY → Dec 31 2099
const PAST = '01012000'; // Jan 1 2000

/** A fetchFn stub that returns fixed records (or fails). */
function mockFetch(
  records: unknown,
  opts: { ok?: boolean; status?: number; throwErr?: boolean } = {},
): FetchFn {
  return async () => {
    if (opts.throwErr) throw new Error('network down');
    return {
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      json: async () => records,
    };
  };
}

function provider(fetchFn: FetchFn): TdlrProvider {
  return new TdlrProvider({ fetchFn, appToken: 'test-token', timeoutMs: 1000 });
}

const SUBS = ['sub-electrical'];

describe('parseTdlrExpiration', () => {
  it('parses 8-digit MMDDYYYY', () => {
    expect(parseTdlrExpiration('12312099')?.getFullYear()).toBe(2099);
    expect(parseTdlrExpiration('07312027')?.getMonth()).toBe(6); // July (0-indexed)
  });
  it('parses ISO and MM/DD/YYYY', () => {
    expect(parseTdlrExpiration('2099-12-31')?.getFullYear()).toBe(2099);
    expect(parseTdlrExpiration('7/31/2027')?.getFullYear()).toBe(2027);
  });
  it('returns null for garbage / empty', () => {
    expect(parseTdlrExpiration('NOTADATE')).toBeNull();
    expect(parseTdlrExpiration(undefined)).toBeNull();
    expect(parseTdlrExpiration('')).toBeNull();
  });
});

describe('TdlrProvider.verify', () => {
  it('approves an active license with a matching holder name', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '12345',
          license_type: 'Master Electrician',
          owner_name: 'John Smith',
          license_expiration_date_mmddccyy: FUTURE,
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.approved).toBe(true);
    expect(r.reason).toBe('provider_approved');
    expect(r.context?.matchScore).toBe(1);
  });

  it('matches against the business name when owner name differs', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '222',
          license_type: 'Electrical Contractor',
          owner_name: '',
          business_name: 'John Smith Electric LLC',
          license_expiration_date_mmddccyy: FUTURE,
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '222', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.approved).toBe(true);
  });

  it('queues (name_mismatch) when the holder name does not match', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '12345',
          license_type: 'Master Electrician',
          owner_name: 'Maria Garcia',
          license_expiration_date_mmddccyy: FUTURE,
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.approved).toBe(false);
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('name_mismatch');
    expect(r.context?.claimedName).toBe('John Smith');
  });

  it('rejects an expired license (name matched)', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '12345',
          license_type: 'A/C Contractor — Air Conditioning and Refrigeration',
          owner_name: 'John Smith',
          license_expiration_date_mmddccyy: PAST,
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.approved).toBe(false);
    expect(r.outcome).toBe('auto_reject');
    expect(r.reason).toBe('license_expired');
  });

  it('queues (license_not_found) when the number returns nothing', async () => {
    const p = provider(mockFetch([]));
    const r = await p.verify({ licenseNumber: '00000', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('license_not_found');
  });

  it('queues when the number belongs to a non-gated trade (e.g. cosmetology)', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '777',
          license_type: 'Cosmetologist',
          owner_name: 'John Smith',
          license_expiration_date_mmddccyy: FUTURE,
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '777', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('license_not_found');
  });

  it('queues (provider_unreachable) on a network error', async () => {
    const p = provider(mockFetch(null, { throwErr: true }));
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('provider_unreachable');
  });

  it('queues (provider_unreachable) on a non-OK response (e.g. 429)', async () => {
    const p = provider(mockFetch([], { ok: false, status: 429 }));
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('provider_unreachable');
  });

  it('queues (license_number_missing) when no number is provided', async () => {
    const p = provider(mockFetch([]));
    const r = await p.verify({ licenseNumber: '  ', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('license_number_missing');
  });

  it('queues (expiration_unparseable) when expiration is unreadable but name matches', async () => {
    const p = provider(
      mockFetch([
        {
          license_number: '12345',
          license_type: 'Journeyman Electrician',
          owner_name: 'John Smith',
          license_expiration_date_mmddccyy: 'NOTADATE',
        },
      ]),
    );
    const r = await p.verify({ licenseNumber: '12345', holderName: 'John Smith', subcategoryIds: SUBS });
    expect(r.outcome).toBe('queue');
    expect(r.reason).toBe('expiration_unparseable');
  });
});
