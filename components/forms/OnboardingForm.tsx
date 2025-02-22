"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/nextjs";
import {
  createOrUpdateProfile,
  createFitnessGoal,
  createMeasurements,
} from "@/lib/services/profile";

const formSchema = z.object({
  // Profile
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]),
  daily_calorie_target: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  preferred_workout_time: z.string().optional(),

  // Fitness Goals
  goal_type: z.enum([
    "weight_loss",
    "muscle_gain",
    "endurance",
    "flexibility",
    "general_fitness",
  ]),

  // Measurements
  weight_kg: z.string().transform((val) => parseFloat(val)),
  height_cm: z.string().transform((val) => parseFloat(val)),
  body_fat_percentage: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  chest_cm: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  waist_cm: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 3;
  const { getToken } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      experience_level: "beginner",
      daily_calorie_target: undefined,
      goal_type: "general_fitness",
      weight_kg: undefined,
      height_cm: undefined,
    },
  });

  async function onSubmit(data: FormData) {
    console.log("Form submitted with data:", data);
    setIsLoading(true);

    try {
      const supabaseToken = await getToken({ template: "supabase" });
      if (!supabaseToken) {
        throw new Error("Failed to get authentication token");
      }

      // Decode and log JWT payload for debugging
      const [header, payload, signature] = supabaseToken?.split(".") || [];
      if (!payload) {
        throw new Error("Invalid JWT token");
      }

      const decodedPayload = JSON.parse(atob(payload)) as {
        email: string;
        sub: string;
        [key: string]: any;
      };

      const supabase = createSupabaseClient(supabaseToken);

      // Create or update profile
      const profile = await createOrUpdateProfile(supabase, {
        clerk_id: userId,
        email: decodedPayload.email,
        full_name: data.full_name,
        experience_level: data.experience_level,
        daily_calorie_target: data.daily_calorie_target,
      });

      if (!profile?.id) {
        throw new Error("Failed to create profile");
      }

      // Create fitness goal with the profile ID
      const fitnessGoal = await createFitnessGoal(
        supabase,
        profile.id,
        data.goal_type
      );

      if (!fitnessGoal) {
        throw new Error("Failed to create fitness goal");
      }

      // Create measurements
      const measurements = await createMeasurements(supabase, {
        profile_id: profile.id,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage,
        chest_cm: data.chest_cm,
        waist_cm: data.waist_cm,
      });

      if (!measurements) {
        throw new Error("Failed to create measurements");
      }

      toast({
        title: "Success",
        description: "Profile created successfully!",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 ">
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="bg-gray-700 border-gray-600 text-gray-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">
                        Experience Level
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem
                            value="beginner"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Beginner
                          </SelectItem>
                          <SelectItem
                            value="intermediate"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Intermediate
                          </SelectItem>
                          <SelectItem
                            value="advanced"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Advanced
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daily_calorie_target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">
                        Daily Calorie Target (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-gray-700 border-gray-600 text-gray-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setStep(2)}
                >
                  Next Step
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Fitness Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="goal_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">
                        Primary Goal
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                            <SelectValue placeholder="Select your primary goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem
                            value="weight_loss"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Weight Loss
                          </SelectItem>
                          <SelectItem
                            value="muscle_gain"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Muscle Gain
                          </SelectItem>
                          <SelectItem
                            value="endurance"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Endurance
                          </SelectItem>
                          <SelectItem
                            value="flexibility"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            Flexibility
                          </SelectItem>
                          <SelectItem
                            value="general_fitness"
                            className="text-gray-100 focus:bg-gray-600 focus:text-gray-100"
                          >
                            General Fitness
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-600 text-gray-800 hover:bg-gray-700"
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setStep(3)}
                  >
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">
                  Body Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            className="bg-gray-700 border-gray-600 text-gray-100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Height (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            className="bg-gray-700 border-gray-600 text-gray-100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chest_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Chest (cm) (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            className="bg-gray-700 border-gray-600 text-gray-100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waist_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Waist (cm) (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            className="bg-gray-700 border-gray-600 text-gray-100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-600 text-gray-800 hover:bg-gray-700 hover:text-gray-300"
                    onClick={() => setStep(2)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Profile..." : "Complete Setup"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
