CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
  workout_type TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_sessions
CREATE POLICY "Enable all for users based on profile ownership"
  ON workout_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = workout_sessions.profile_id
      AND profiles.clerk_id = auth.uid()::text
    )
  );

-- Create indexes
CREATE INDEX idx_workout_sessions_profile_id ON workout_sessions(profile_id);
CREATE INDEX idx_workout_sessions_created_at ON workout_sessions(created_at); 