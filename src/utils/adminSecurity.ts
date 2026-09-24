/**
 * Platform Administrator Authorization & Security Utilities
 *
 * Designates authorized platform administrator emails and provides
 * authoritative security checks to ensure administrative features and routes
 * are strictly restricted to verified administrators.
 */

export const PRIMARY_ADMIN_EMAIL = 'raghavsingh6204@gmail.com';

/**
 * Obfuscated administrative base path.
 * Unpredictable URL routing preventing automated brute-force discovery or dictionary scanning.
 */
export const ADMIN_BASE_PATH = '/portal-sec-ops-7491';

/**
 * Generates an unpredictable admin route path for subpaths (e.g., 'dashboard', 'requests').
 */
export function getAdminPath(subpath: string = ''): string {
  if (!subpath) return ADMIN_BASE_PATH;
  const clean = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${ADMIN_BASE_PATH}${clean}`;
}

export const AUTHORIZED_ADMIN_EMAILS: readonly string[] = Object.freeze([
  'raghavsingh6204@gmail.com',
  'admin@petadoption.org',
]);

/**
 * Checks whether an email address is an authorized platform administrator.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Authoritative check: Verifies if a user has platform administrator authorization.
 * Returns true if the user's verified email matches the authorized admin email OR
 * if their assigned account role is 'admin'.
 */
export function isAuthorizedAdmin(
  user?: { email?: string | null; role?: string | null } | null
): boolean {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  return user.role === 'admin';
}
