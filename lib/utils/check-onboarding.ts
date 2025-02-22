import { createClient } from "@/lib/supabase/server";

export async function checkUserNeedsOnboarding(clerkId: string) {
  const supabase = createClient();

  // Check for profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, experience_level")
    .eq("clerk_id", clerkId)
    .single();

  // Only return true if there's no profile or if required fields are empty
  return !profile || !profile.full_name || !profile.experience_level;
}
