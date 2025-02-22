/*
  # Initial Schema Setup for AI Fitness Coach

  1. Tables Created:
    - profiles (extends Clerk user data)
    - fitness_goals
    - user_measurements
    - workout_sessions
    - exercise_library
    - user_progress
    - feedback_history

  2. Security:
    - RLS policies for all tables
    - Secure user data access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Clerk user data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  daily_calorie_target INTEGER,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_workout_time TIME
);

-- Fitness Goals table
CREATE TABLE fitness_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness')),
  target_value DECIMAL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'abandoned'))
);

-- User Measurements table
CREATE TABLE user_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL,
  height_cm DECIMAL,
  body_fat_percentage DECIMAL,
  chest_cm DECIMAL,
  waist_cm DECIMAL,
  hip_cm DECIMAL,
  measured_at TIMESTAMPTZ DEFAULT now()
);

-- Exercise Library table
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'balance')),
  equipment_required TEXT[],
  muscle_groups TEXT[],
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Sessions table
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  session_type TEXT CHECK (session_type IN ('guided', 'free', 'program')),
  exercises JSON[],
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  notes TEXT
);

-- User Progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Feedback History table
CREATE TABLE feedback_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  feedback_type TEXT CHECK (feedback_type IN ('form_correction', 'encouragement', 'technique_tip', 'safety_warning')),
  feedback_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (clerk_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (clerk_id = auth.uid());

CREATE POLICY "Users can read own fitness goals"
  ON fitness_goals FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can manage own fitness goals"
  ON fitness_goals FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can read own measurements"
  ON user_measurements FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can manage own measurements"
  ON user_measurements FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can read own workout sessions"
  ON workout_sessions FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can manage own workout sessions"
  ON workout_sessions FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can read own progress"
  ON user_progress FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can read own feedback"
  ON feedback_history FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

CREATE POLICY "Users can manage own feedback"
  ON feedback_history FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()));

-- Create indexes for better query performance
CREATE INDEX idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX idx_fitness_goals_profile_id ON fitness_goals(profile_id);
CREATE INDEX idx_user_measurements_profile_id ON user_measurements(profile_id);
CREATE INDEX idx_workout_sessions_profile_id ON workout_sessions(profile_id);
CREATE INDEX idx_user_progress_profile_id ON user_progress(profile_id);
CREATE INDEX idx_feedback_history_profile_id ON feedback_history(profile_id);
CREATE INDEX idx_feedback_history_session_id ON feedback_history(session_id);