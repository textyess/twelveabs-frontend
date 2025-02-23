import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { WorkoutSession } from "@/components/workout-session";

export default async function NewWorkoutPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <WorkoutSession userId={userId} />;
}
