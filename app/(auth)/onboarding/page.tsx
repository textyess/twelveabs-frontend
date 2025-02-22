import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/forms/OnboardingForm";
import { DumbbellIcon } from "lucide-react";

export default async function OnboardingPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <div className="flex flex-col items-center text-center">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Let us get to know you
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              This information helps us tailor workouts and track your progress
              effectively.
            </p>
          </div>
        </div>
      </div>

      <OnboardingForm userId={userId} />
    </div>
  );
}
