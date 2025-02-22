import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { WorkoutSession } from "@/components/workout-session";

export default async function NewWorkoutPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          New Workout Session
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Start your workout session and get real-time feedback on your form.
        </p>
      </div>

      <WorkoutSession />
    </div>
  );
}
