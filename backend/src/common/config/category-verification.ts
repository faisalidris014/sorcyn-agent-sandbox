/**
 * Maps category slugs to required/recommended verification types.
 * Used in offer submission to warn sellers about missing verifications.
 */
export const CATEGORY_VERIFICATION_MAP: Record<string, {
  required: string[];
  recommended: string[];
  description: string;
}> = {
  childcare: {
    required: ['background_check'],
    recommended: ['id'],
    description: 'Background check required for childcare services',
  },
  pet_care: {
    required: [],
    recommended: ['background_check', 'insurance'],
    description: 'Insurance recommended for pet care',
  },
  electrical: {
    required: ['license'],
    recommended: ['insurance'],
    description: 'License required for electrical work',
  },
  plumbing: {
    required: ['license'],
    recommended: ['insurance'],
    description: 'License required for plumbing work',
  },
  hvac: {
    required: ['license'],
    recommended: ['insurance'],
    description: 'License required for HVAC work',
  },
  roofing: {
    required: ['license', 'insurance'],
    recommended: [],
    description: 'License and insurance required for roofing',
  },
  auto_repair: {
    required: ['license'],
    recommended: ['insurance'],
    description: 'License required for auto repair',
  },
  personal_training: {
    required: [],
    recommended: ['license', 'insurance'],
    description: 'Certification and insurance recommended for personal training',
  },
};

/**
 * Check which required verifications a seller is missing for a given category.
 */
export function getMissingVerifications(
  categorySlug: string,
  seller: {
    idVerified: boolean;
    licenseVerified: boolean;
    insuranceVerified: boolean;
    backgroundCheckVerified: boolean;
    einVerified: boolean;
  },
): { missing: string[]; description: string } | null {
  const mapping = CATEGORY_VERIFICATION_MAP[categorySlug];
  if (!mapping) return null;

  const verificationStatus: Record<string, boolean> = {
    id: seller.idVerified,
    ein: seller.einVerified,
    license: seller.licenseVerified,
    insurance: seller.insuranceVerified,
    background_check: seller.backgroundCheckVerified,
  };

  const missing = mapping.required.filter((v) => !verificationStatus[v]);
  if (missing.length === 0) return null;

  return { missing, description: mapping.description };
}
