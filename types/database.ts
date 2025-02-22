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
          clerk_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
          daily_calorie_target: number | null;
          experience_level: "beginner" | "intermediate" | "advanced";
          preferred_workout_time: string | null;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
          daily_calorie_target?: number | null;
          experience_level: "beginner" | "intermediate" | "advanced";
          preferred_workout_time?: string | null;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
          daily_calorie_target?: number | null;
          experience_level?: "beginner" | "intermediate" | "advanced";
          preferred_workout_time?: string | null;
        };
      };
      fitness_goals: {
        Row: {
          id: string;
          profile_id: string;
          goal_type:
            | "weight_loss"
            | "muscle_gain"
            | "endurance"
            | "flexibility"
            | "general_fitness";
          target_value: number | null;
          target_date: string | null;
          created_at: string;
          updated_at: string;
          status: "in_progress" | "achieved" | "abandoned";
        };
        Insert: {
          id?: string;
          profile_id: string;
          goal_type:
            | "weight_loss"
            | "muscle_gain"
            | "endurance"
            | "flexibility"
            | "general_fitness";
          target_value?: number | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: "in_progress" | "achieved" | "abandoned";
        };
        Update: {
          id?: string;
          profile_id?: string;
          goal_type?:
            | "weight_loss"
            | "muscle_gain"
            | "endurance"
            | "flexibility"
            | "general_fitness";
          target_value?: number | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: "in_progress" | "achieved" | "abandoned";
        };
      };
      user_measurements: {
        Row: {
          id: string;
          profile_id: string;
          weight_kg: number | null;
          height_cm: number | null;
          body_fat_percentage: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          hip_cm: number | null;
          measured_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percentage?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hip_cm?: number | null;
          measured_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percentage?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hip_cm?: number | null;
          measured_at?: string;
        };
      };
    };
  };
}
