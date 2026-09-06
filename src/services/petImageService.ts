import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/database.types';

export type PetImageRow = Database['public']['Tables']['pet_images']['Row'];
export type PetImageInsert = Database['public']['Tables']['pet_images']['Insert'];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Service for managing pet images stored in Supabase PostgreSQL (`pet_images`)
 * and prepared for future Supabase Storage bucket integration.
 */
export const petImageService = {
  /**
   * Retrieves all image URLs for a specific pet ordered by display order.
   */
  async getImagesForPet(petId: string): Promise<string[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await (supabase as any)
        .from('pet_images')
        .select('image_url, display_order, is_primary')
        .eq('pet_id', petId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn(`[petImageService] Failed to load images for pet ${petId}:`, error);
        return [];
      }

      return (data || []).map((img: { image_url: string }) => img.image_url);
    } catch (err) {
      console.warn(`[petImageService] Exception loading images for pet ${petId}:`, err);
      return [];
    }
  },

  /**
   * Saves or replaces images for a pet in the `public.pet_images` table.
   * Enforces display order and designates the first image as primary.
   */
  async savePetImages(petId: string, imageUrls: string[]): Promise<void> {
    if (!isSupabaseConfigured() || imageUrls.length === 0) {
      return;
    }

    try {
      // Build rows for insertion
      const rows: PetImageInsert[] = imageUrls.map((url, index) => ({
        pet_id: petId,
        image_url: url.trim(),
        display_order: index,
        is_primary: index === 0,
      }));

      // Delete existing image records for this pet
      await (supabase as any)
        .from('pet_images')
        .delete()
        .eq('pet_id', petId);

      // Insert new image records
      const { error } = await (supabase as any)
        .from('pet_images')
        .insert(rows);

      if (error) {
        console.error(`[petImageService] Error inserting pet images for ${petId}:`, error);
        throw error;
      }
    } catch (err) {
      console.error(`[petImageService] Exception saving images for pet ${petId}:`, err);
      throw err;
    }
  },

  /**
   * Secure upload method for Supabase Storage 'pet-photos' bucket.
   * Validates MIME type, restricts file size to 5MB, and scopes path to authenticated provider.
   */
  async uploadPetImage(
    file: File,
    customPrefix?: string
  ): Promise<{ publicUrl?: string; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Supabase is not configured. Upload unavailable in pure demo mode.',
      };
    }

    // 1. Strict MIME Type Validation
    const normalizedType = file.type?.toLowerCase();
    if (!normalizedType || !ALLOWED_MIME_TYPES.includes(normalizedType)) {
      return {
        error: 'Invalid file type. Only JPEG, PNG, WebP, and AVIF images are permitted.',
      };
    }

    // 2. Strict File Size Validation (Max 5MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        error: 'File exceeds the maximum 5MB size limit. Please upload a smaller image.',
      };
    }

    try {
      // 3. Resolve authenticated user identity for scoped storage path
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        return {
          error: 'Authentication required to upload pet images.',
        };
      }

      // 4. Sanitize extension
      const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
      const rawExt = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(rawExt) ? rawExt : 'jpg';

      // Scoped path: pets/{auth.uid()}/{timestamp}_{random}.{ext}
      const fileName = `pets/${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${safeExt}`;

      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return {
          error: `Storage upload notice: ${error.message}`,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(data.path);

      return { publicUrl: publicUrlData.publicUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      return { error: message };
    }
  },
};
