/**
 * Copyright takedown + repeat-infringer tunables (#313).
 */

/**
 * Number of taken-down images (strikes) at which a user is auto-suspended and
 * hard-blocked from uploading. Each admin takedown and each staydown block adds 1.
 */
export const STRIKE_THRESHOLD = 3;

/**
 * Max Hamming distance (out of 64 bits) at which two dHash fingerprints are
 * treated as "the same image" for the staydown blocklist. Lower = stricter.
 * Start at 8 and tune against false positives/negatives on real uploads.
 */
export const PHASH_HAMMING_THRESHOLD = 8;
