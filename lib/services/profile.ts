import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type FitnessGoal = Database["public"]["Tables"]["fitness_goals"]["Row"];
type UserMeasurement = Database["public"]["Tables"]["user_measurements"]["Row"];

export async function createOrUpdateProfile(
  supabase: SupabaseClient<Database>,
  data: {
    clerk_id: string;
    email: string;
    full_name: string;
    experience_level: Profile["experience_level"];
    daily_calorie_target?: number;
  }
) {
  console.log("Creating/updating profile with data:", data);

  // First check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select()
    .eq("clerk_id", data.clerk_id)
    .single();

  console.log("Existing profile:", existingProfile);

  if (existingProfile) {
    console.log("Profile already exists:", existingProfile);
    return existingProfile;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        clerk_id: data.clerk_id,
        email: data.email,
        full_name: data.full_name,
        experience_level: data.experience_level,
        daily_calorie_target: data.daily_calorie_target,
      },
      {
        onConflict: "clerk_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Profile creation/update error:", error);
    throw error;
  }

  console.log("Profile created/updated successfully:", profile);
  return profile;
}

export async function createFitnessGoal(
  supabase: SupabaseClient<Database>,
  profileId: string,
  goalType: string
): Promise<FitnessGoal | null> {
  try {
    console.log("Creating fitness goal with profile ID:", profileId);
    console.log("Goal type:", goalType);

    // First verify the profile exists and belongs to the current user
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, clerk_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      console.error("Error verifying profile:", profileError);
      throw new Error("Profile not found or access denied");
    }

    console.log("Verified profile:", profile);

    // Create the fitness goal
    const { data: goal, error: goalError } = await supabase
      .from("fitness_goals")
      .insert([
        {
          profile_id: profile.id,
          goal_type: goalType,
        },
      ])
      .select()
      .single();

    if (goalError) {
      console.error("Error creating fitness goal:", goalError);
      throw goalError;
    }

    console.log("Created fitness goal:", goal);
    return goal;
  } catch (error) {
    console.error("Error in createFitnessGoal:", error);
    throw error;
  }
}

export async function createMeasurements(
  supabase: SupabaseClient<Database>,
  data: {
    profile_id: string;
    weight_kg: number;
    height_cm: number;
    body_fat_percentage?: number;
    chest_cm?: number;
    waist_cm?: number;
  }
) {
  // First verify that the profile exists and belongs to the current user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.profile_id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found or unauthorized");
  }

  const { data: measurements, error } = await supabase
    .from("user_measurements")
    .insert({
      profile_id: data.profile_id,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      body_fat_percentage: data.body_fat_percentage,
      chest_cm: data.chest_cm,
      waist_cm: data.waist_cm,
    })
    .select()
    .single();

  if (error) throw error;
  return measurements;
}
