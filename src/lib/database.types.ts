export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'adopter' | 'provider' | 'admin';
          full_name: string;
          email: string;
          phone: string | null;
          profile_image_url: string | null;
          city: string | null;
          locality: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'adopter' | 'provider' | 'admin';
          full_name: string;
          email: string;
          phone?: string | null;
          profile_image_url?: string | null;
          city?: string | null;
          locality?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'adopter' | 'provider' | 'admin';
          full_name?: string;
          email?: string;
          phone?: string | null;
          profile_image_url?: string | null;
          city?: string | null;
          locality?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      adopter_profiles: {
        Row: {
          id: string;
          occupation: string | null;
          housing_type: string | null;
          work_type: string | null;
          time_away: string | null;
          activity_level: string | null;
          children: string | null;
          existing_pets: string | null;
          has_other_pets: boolean;
          other_pets_details: string | null;
          experience_with_pets: string | null;
          household_members: number | null;
          preferred_pet_types: string[];
          preferred_size: string[];
          preferred_energy_level: string[];
          why_they_want_to_adopt: string | null;
          profile_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          occupation?: string | null;
          housing_type?: string | null;
          work_type?: string | null;
          time_away?: string | null;
          activity_level?: string | null;
          children?: string | null;
          existing_pets?: string | null;
          has_other_pets?: boolean;
          other_pets_details?: string | null;
          experience_with_pets?: string | null;
          household_members?: number | null;
          preferred_pet_types?: string[];
          preferred_size?: string[];
          preferred_energy_level?: string[];
          why_they_want_to_adopt?: string | null;
          profile_completion?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          occupation?: string | null;
          housing_type?: string | null;
          work_type?: string | null;
          time_away?: string | null;
          activity_level?: string | null;
          children?: string | null;
          existing_pets?: string | null;
          has_other_pets?: boolean;
          other_pets_details?: string | null;
          experience_with_pets?: string | null;
          household_members?: number | null;
          preferred_pet_types?: string[];
          preferred_size?: string[];
          preferred_energy_level?: string[];
          why_they_want_to_adopt?: string | null;
          profile_completion?: number;
          updated_at?: string;
        };
      };
      provider_profiles: {
        Row: {
          id: string;
          organization_name: string | null;
          provider_type: string;
          description: string | null;
          city: string | null;
          locality: string | null;
          verification_status: 'pending' | 'verified' | 'rejected';
          verification_notes: string | null;
          profile_image_url: string | null;
          website_url: string | null;
          active_listings_count: number;
          successful_adoptions_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_name?: string | null;
          provider_type?: string;
          description?: string | null;
          city?: string | null;
          locality?: string | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_notes?: string | null;
          profile_image_url?: string | null;
          website_url?: string | null;
          active_listings_count?: number;
          successful_adoptions_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_name?: string | null;
          provider_type?: string;
          description?: string | null;
          city?: string | null;
          locality?: string | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_notes?: string | null;
          profile_image_url?: string | null;
          website_url?: string | null;
          active_listings_count?: number;
          successful_adoptions_count?: number;
          updated_at?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          provider_id: string;
          name: string;
          species: string;
          breed: string;
          breed_type: string | null;
          age: string;
          date_of_birth: string | null;
          gender: string;
          size: string;
          city: string;
          locality: string | null;
          description: string;
          temperament: string[];
          personality: string[];
          energy_level: string;
          good_with_children: boolean;
          good_with_dogs: boolean;
          good_with_cats: boolean;
          apartment_friendly: boolean;
          training_information: string | null;
          health_information: string | null;
          vaccination_status: string;
          sterilization_status: string;
          special_needs: string | null;
          adoption_status: string;
          stats: Json;
          provider_insight: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          name: string;
          species: string;
          breed: string;
          breed_type?: string | null;
          age: string;
          date_of_birth?: string | null;
          gender: string;
          size: string;
          city: string;
          locality?: string | null;
          description: string;
          temperament?: string[];
          personality?: string[];
          energy_level?: string;
          good_with_children?: boolean;
          good_with_dogs?: boolean;
          good_with_cats?: boolean;
          apartment_friendly?: boolean;
          training_information?: string | null;
          health_information?: string | null;
          vaccination_status?: string;
          sterilization_status?: string;
          special_needs?: string | null;
          adoption_status?: string;
          stats?: Json;
          provider_insight?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_id?: string;
          name?: string;
          species?: string;
          breed?: string;
          breed_type?: string | null;
          age?: string;
          date_of_birth?: string | null;
          gender?: string;
          size?: string;
          city?: string;
          locality?: string | null;
          description?: string;
          temperament?: string[];
          personality?: string[];
          energy_level?: string;
          good_with_children?: boolean;
          good_with_dogs?: boolean;
          good_with_cats?: boolean;
          apartment_friendly?: boolean;
          training_information?: string | null;
          health_information?: string | null;
          vaccination_status?: string;
          sterilization_status?: string;
          special_needs?: string | null;
          adoption_status?: string;
          stats?: Json;
          provider_insight?: Json;
          updated_at?: string;
        };
      };
      pet_images: {
        Row: {
          id: string;
          pet_id: string;
          image_url: string;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          image_url: string;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          display_order?: number;
          is_primary?: boolean;
        };
      };
      favorites: {
        Row: {
          id: string;
          adopter_id: string;
          pet_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          adopter_id: string;
          pet_id: string;
          created_at?: string;
        };
        Update: {
          adopter_id?: string;
          pet_id?: string;
        };
      };
      adoption_requests: {
        Row: {
          id: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          status: string;
          message: string;
          home_type: string | null;
          existing_pets: string | null;
          children: string | null;
          pet_experience: string | null;
          time_available: string | null;
          why_they_want_to_adopt: string | null;
          confirmed_accurate: boolean;
          provider_notes: string | null;
          reviewed_at: string | null;
          timeline: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          status?: string;
          message: string;
          home_type?: string | null;
          existing_pets?: string | null;
          children?: string | null;
          pet_experience?: string | null;
          time_available?: string | null;
          why_they_want_to_adopt?: string | null;
          confirmed_accurate?: boolean;
          provider_notes?: string | null;
          reviewed_at?: string | null;
          timeline?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          message?: string;
          provider_notes?: string | null;
          reviewed_at?: string | null;
          timeline?: Json;
          updated_at?: string;
        };
      };
      adoptions: {
        Row: {
          id: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          adoption_request_id: string | null;
          adoption_date: string;
          status: 'trial' | 'completed' | 'returned' | 'cancelled';
          certificate_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          adoption_request_id?: string | null;
          adoption_date?: string;
          status?: 'trial' | 'completed' | 'returned' | 'cancelled';
          certificate_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'trial' | 'completed' | 'returned' | 'cancelled';
          certificate_number?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      foster_trials: {
        Row: {
          id: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          adoption_request_id: string | null;
          adoption_id: string | null;
          start_date: string;
          end_date: string;
          status: string;
          journal_entries: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          adopter_id: string;
          provider_id: string;
          adoption_request_id?: string | null;
          adoption_id?: string | null;
          start_date: string;
          end_date: string;
          status?: string;
          journal_entries?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          status?: string;
          journal_entries?: Json;
          updated_at?: string;
        };
      };
      trial_extension_requests: {
        Row: {
          id: string;
          trial_id: string;
          requested_by: string;
          requested_days: 3 | 7 | 14;
          reason: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'declined' | 'cancelled';
          reviewed_by: string | null;
          reviewed_at: string | null;
          provider_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trial_id: string;
          requested_by: string;
          requested_days: 3 | 7 | 14;
          reason?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'declined' | 'cancelled';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          provider_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected' | 'declined' | 'cancelled';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          provider_response?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
          read_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          target_name: string | null;
          reason: string;
          description: string;
          status: string;
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          target_name?: string | null;
          reason: string;
          description: string;
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      provider_verifications: {
        Row: {
          id: string;
          provider_id: string;
          status: 'pending' | 'verified' | 'rejected';
          document_type: string | null;
          document_url: string | null;
          submitted_data: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          status?: 'pending' | 'verified' | 'rejected';
          document_type?: string | null;
          document_url?: string | null;
          submitted_data?: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'verified' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          previous_state: Json | null;
          new_state: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          previous_state?: Json | null;
          new_state?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
      };
    };
  };
}
