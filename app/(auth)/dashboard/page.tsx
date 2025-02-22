import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutSessionsTable } from "@/components/workout-sessions-table";
import { WorkoutSessionsColumns } from "@/components/work-sessions-columns";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = createClient();

  // Get the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  // Get the user's workout sessions
  const { data: workoutSessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("profile_id", profile?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container max-w-6xl mx-auto px-4">
      <div className="mb-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Your Workouts
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              Track your fitness journey and see your progress over time.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Start New Workout
          </Button>
        </div>
      </div>

      <WorkoutSessionsTable
        columns={WorkoutSessionsColumns}
        data={workoutSessions || []}
      />
    </div>
  );
}
