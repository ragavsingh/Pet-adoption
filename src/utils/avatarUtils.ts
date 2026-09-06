/**
 * Avatar Utilities
 * 
 * Generates authentic Google / Gmail style display pictures (DPs) by default
 * and prevents showing random stranger photos (e.g. Unsplash placeholders)
 * for registered users and adopters.
 */

// Google Material color palette identical to Gmail account avatars
export const GOOGLE_AVATAR_PALETTE = [
  '#1a73e8', // Google Blue
  '#d93025', // Google Red
  '#1e8e3e', // Google Green
  '#f9ab00', // Google Amber / Yellow
  '#8430ce', // Google Purple
  '#00897b', // Google Teal
  '#d81b60', // Google Pink
  '#e8710a', // Google Orange
  '#0288d1', // Google Light Blue / Cyan
  '#5c6bc0', // Google Indigo
];

/**
 * Known dummy/placeholder stranger photos from Unsplash that should NEVER
 * be shown on a real user's profile or account header.
 */
const RANDOM_PLACEHOLDER_SUBSTRINGS = [
  'photo-1535713875002-d1d0cf377fde', // man with beanie
  'photo-1534528741775-53994a69daeb',
  'photo-1580489944761-15a19d654956',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1544005313-94ddf0286df2',
  'placeholder-user',
  'dummy-avatar',
];

/**
 * Checks if a given avatar URL is an unwanted random placeholder photo.
 */
export function isDummyPlaceholderPhoto(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return true;
  return RANDOM_PLACEHOLDER_SUBSTRINGS.some((sub) => trimmed.includes(sub));
}

/**
 * Generates an authentic Google / Gmail style circular initial avatar.
 * Matches Gmail's default display picture when no custom photo is uploaded.
 * 
 * @param name User's display name or nickname
 * @param email User's email address
 */
export function getGoogleDefaultAvatar(name?: string | null, email?: string | null): string {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim();

  // Extract primary character (prefer name first, then email username, default 'U')
  let initial = 'U';
  if (cleanName) {
    initial = cleanName.charAt(0).toUpperCase();
  } else if (cleanEmail) {
    initial = cleanEmail.split('@')[0].charAt(0).toUpperCase();
  }

  // Generate deterministic color index using email (or name)
  const seed = (cleanEmail || cleanName || 'user').toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % GOOGLE_AVATAR_PALETTE.length;
  const bgColor = GOOGLE_AVATAR_PALETTE[colorIndex];

  // Render clean, high-DPI circular SVG avatar
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
    <rect width="128" height="128" rx="64" fill="${bgColor}"/>
    <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Google Sans', 'Roboto', 'Segoe UI', Arial, sans-serif" font-size="64" font-weight="600">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves the display picture for a user:
 * - If user uploaded a real custom photo or has a Google OAuth photo, returns that photo URL.
 * - If avatar is missing, empty, or an unwanted random Unsplash photo, returns their authentic Gmail default DP.
 */
export function resolveUserAvatar(user?: {
  avatar?: string | null;
  avatarUrl?: string | null;
  profile_image_url?: string | null;
  name?: string | null;
  fullName?: string | null;
  email?: string | null;
} | null): string {
  if (!user) {
    return getGoogleDefaultAvatar('User', 'user@example.com');
  }

  const rawPhoto = user.avatar || user.avatarUrl || user.profile_image_url;
  const name = user.name || user.fullName || '';
  const email = user.email || '';

  if (rawPhoto && !isDummyPlaceholderPhoto(rawPhoto)) {
    return rawPhoto;
  }

  return getGoogleDefaultAvatar(name, email);
}

/**
 * Compresses and resizes a user uploaded image to max 512x512 for optimal
 * profile picture storage and high-speed loading.
 */
export async function optimizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

