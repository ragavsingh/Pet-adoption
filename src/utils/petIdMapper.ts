import { isUUID } from './authMode';

const DEMO_TO_UUID_MAP: Record<string, string> = {
  pet_bruno: 'b0000000-0000-0000-0000-000000000001',
  pet_luna: 'b0000000-0000-0000-0000-000000000002',
  pet_milo: 'b0000000-0000-0000-0000-000000000003',
  pet_coco: 'b0000000-0000-0000-0000-000000000004',
  pet_bella: 'b0000000-0000-0000-0000-000000000005',
};

// Populate pet_06 through pet_50
for (let i = 6; i <= 50; i++) {
  const padded = i < 10 ? `0${i}` : `${i}`;
  const key = `pet_${padded}`;
  const uuid = `b0000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
  DEMO_TO_UUID_MAP[key] = uuid;
}

/**
 * Converts any pet identifier (e.g. 'pet_luna' or UUID) into a valid database UUID.
 * Returns the original string if it is already a UUID or if no mapping exists.
 */
export function toPetDatabaseUUID(idOrAlias: string): string {
  if (!idOrAlias) return idOrAlias;
  if (isUUID(idOrAlias)) return idOrAlias;
  const mapped = DEMO_TO_UUID_MAP[idOrAlias.toLowerCase()];
  return mapped || idOrAlias;
}

/**
 * Checks if a given ID matches Luna, Bruno, or any known seeded platform pet.
 */
export function getSeededUUIDForPet(idOrName: string): string | null {
  if (!idOrName) return null;
  const clean = idOrName.toLowerCase().trim();
  if (DEMO_TO_UUID_MAP[clean]) return DEMO_TO_UUID_MAP[clean];
  if (clean === 'bruno') return DEMO_TO_UUID_MAP['pet_bruno'];
  if (clean === 'luna') return DEMO_TO_UUID_MAP['pet_luna'];
  if (clean === 'milo') return DEMO_TO_UUID_MAP['pet_milo'];
  if (clean === 'coco') return DEMO_TO_UUID_MAP['pet_coco'];
  if (clean === 'bella') return DEMO_TO_UUID_MAP['pet_bella'];
  return null;
}
