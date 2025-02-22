export type WorkoutSession = {
  id: string;
  profile_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  calories_burned?: number;
  session_type: "guided" | "free" | "program";
  exercises?: any[];
  status: "in_progress" | "completed" | "cancelled";
  feedback_rating?: number;
  notes?: string;
};

export type Database = {
  public: {
    Tables: {
      workout_sessions: {
        Row: WorkoutSession;
        Insert: Omit<WorkoutSession, "id">;
        Update: Partial<Omit<WorkoutSession, "id">>;
      };
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          // Add other profile fields if needed
        };
      };
    };
  };
};
