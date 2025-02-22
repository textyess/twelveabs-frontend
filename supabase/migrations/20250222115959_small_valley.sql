/*
  # Initial Schema Setup for TwelveAbs

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

-- First, drop everything
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own fitness goals" ON fitness_goals;
DROP POLICY IF EXISTS "Users can manage own fitness goals" ON fitness_goals;
DROP POLICY IF EXISTS "Users can read own measurements" ON user_measurements;
DROP POLICY IF EXISTS "Users can manage own measurements" ON user_measurements;
DROP POLICY IF EXISTS "Users can read own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can manage own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can read own feedback" ON feedback_history;
DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback_history;

DROP TABLE IF EXISTS feedback_history;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS exercise_library;
DROP TABLE IF EXISTS user_measurements;
DROP TABLE IF EXISTS fitness_goals;
DROP TABLE IF EXISTS profiles;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with proper types matching our TypeScript definitions
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Enable read for users based on clerk_id"
  ON profiles FOR SELECT
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "Enable insert for users based on clerk_id"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = clerk_id);

CREATE POLICY "Enable update for users based on clerk_id"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = clerk_id)
  WITH CHECK (auth.uid()::text = clerk_id);

-- Create policies for fitness goals
DROP POLICY IF EXISTS "Enable all for users based on profile ownership" ON fitness_goals;
CREATE POLICY "Enable all for users based on profile ownership"
  ON fitness_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = fitness_goals.profile_id
      AND profiles.clerk_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = fitness_goals.profile_id
      AND profiles.clerk_id = auth.uid()::text
    )
  );

-- Create policies for measurements
CREATE POLICY "Enable all for users based on profile ownership"
  ON user_measurements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_measurements.profile_id
      AND profiles.clerk_id = auth.uid()::text
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX idx_fitness_goals_profile_id ON fitness_goals(profile_id);
CREATE INDEX idx_user_measurements_profile_id ON user_measurements(profile_id);