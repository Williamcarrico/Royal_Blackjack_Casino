export type Country = {
  code: string;
  name: string;
  allowed: boolean;
  min_age: number;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  country_code: string;
  date_of_birth: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  chips: number;
  total_games: number;
  total_hands: number;
  total_wins: number;
  total_losses: number;
  total_pushes: number;
  total_blackjacks: number;
  created_at: string;
  updated_at: string;
};

export type UserPreferences = {
  user_id: string;
  theme: "dark" | "light" | "system";
  sound_enabled: boolean;
  animation_speed: "slow" | "normal" | "fast";
  bet_amount: number;
  created_at: string;
  updated_at: string;
};

export type Tables = {
  countries: Country;
  user_profiles: UserProfile;
  user_preferences: UserPreferences;
};

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;

// Define Database interface for Supabase types
export interface Database {
  public: {
    Tables: {
      countries: {
        Row: Country;
        Insert: Omit<Country, "code"> & { code: string };
        Update: Partial<Country>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "id" | "created_at" | "updated_at"> & { id: string };
        Update: Partial<Omit<UserProfile, "id">>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, "user_id" | "created_at" | "updated_at"> & { user_id: string };
        Update: Partial<Omit<UserPreferences, "user_id">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};