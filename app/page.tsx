import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { DumbbellIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white">
      <div className="max-w-3xl text-center px-4">
        <div className="mb-8 flex justify-center">
          <DumbbellIcon className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          TwelveAbs
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Your personal AI-powered fitness companion. Get real-time feedback,
          personalized workouts, and achieve your fitness goals faster.
        </p>
        <div className="space-x-4">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button
              size="lg"
              variant="outline"
              className="text-blue-500 hover:bg-gray-800 hover:text-white"
            >
              Sign In
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}
