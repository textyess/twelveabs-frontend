"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, StopCircle, Play, Pause, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useConversation } from "@11labs/react";
import axios from "axios";
interface WorkoutSessionProps {
  userId: string;
}

export function WorkoutSession({ userId }: WorkoutSessionProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState | null>(null);
  const [shouldSendFrames, setShouldSendFrames] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversation = useConversation({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
    clientTools: {
      get_form_tool: async () => {
        const base64Frame = await captureFrame();
        if (!base64Frame) {
          return "I'm sorry, I couldn't capture you form";
        }
        const response = await axios.post(
          `http://localhost:8000/exercise/analyze`,
          {
            image: base64Frame,
            user_id: userId,
          }
        );
        console.log("response", response);
        const data = response.data;

        return data.feedback;
      },
    },
  });

  const supabase = createSupabaseClient();
  const { user } = useUser();

  const captureFrame = async () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx || !videoRef.current) {
      console.error("Failed to get canvas context or video element");
      return;
    }

    try {
      // Draw the current video frame to the canvas
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Convert to base64 and send
      const base64Data = canvasRef.current.toDataURL("image/jpeg", 0.8);
      const base64Frame = base64Data.split(",")[1];
      return base64Frame;
    } catch (error) {
      console.error("Error capturing frame:", error);
      return null;
    }
  };

  const captureAndSendFrame = () => {
    if (!shouldSendFrames || isAudioPlaying) {
      console.log("Skipping frame capture due to conditions not met:", {
        shouldSendFrames,
        isAudioPlaying,
      });
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx || !videoRef.current) {
      console.error("Failed to get canvas context or video element");
      return;
    }

    try {
      // Draw the current video frame to the canvas
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Convert to base64 and send
      const base64Data = canvasRef.current.toDataURL("image/jpeg", 0.8);
      const base64Frame = base64Data.split(",")[1];
      // sendAudioChunk(base64Frame);

      console.log("Frame sent to agent");
    } catch (error) {
      console.error("Error capturing frame:", error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setPermissionState(result.state);

        result.addEventListener("change", () => {
          setPermissionState(result.state);
          if (result.state === "denied") {
            setCameraError(
              "Camera access was denied. Please enable camera access in your browser settings."
            );
            stopCamera();
          }
        });
      }
    } catch (error) {
      console.log("Permissions API not supported");
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      await checkCameraPermission();

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
    } catch (error: any) {
      let errorMessage = "Error accessing camera";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera access was denied. Please allow camera access and try again.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "No camera device was found. Please connect a camera and try again.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage =
          "Could not access the camera. It might be in use by another application.";
      }

      setCameraError(errorMessage);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startSession = async () => {
    if (conversation.status === "connected") {
      setIsSessionActive(true);
      sessionStartTimeRef.current = Date.now();
      // The agent will trigger frame sending through the start_workout tool
    }
    const response = await fetch(
      `/api/elevenlabs?agent_id=${process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID}`
    );
    console.log("response", response);
    if (!response.ok) {
      throw new Error("Failed to get WebSocket URL");
    }

    const { url } = await response.json();

    await conversation.startSession({ url });
  };

  const stopSession = async () => {
    setShouldSendFrames(false);
    setIsSessionActive(false);
    conversation.endSession();

    try {
      // First, get the profile_id from the profiles table using the Clerk ID
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (!profileData?.id) {
        throw new Error("Profile not found");
      }

      // Calculate duration in minutes from the session start time
      const sessionDuration = Math.max(
        1,
        Math.round((Date.now() - sessionStartTimeRef.current) / (1000 * 60))
      );

      // Save workout session directly to Supabase using the profile_id
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert([
          {
            profile_id: profileData.id,
            session_type: "guided",
            duration_minutes: sessionDuration,
            ended_at: new Date().toISOString(),
            status: "completed",
            notes: "AI-guided workout session completed",
            exercises: [],
            calories_burned: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving workout session:", error);
    }

    sessionStartTimeRef.current = 0;
    lastFrameTimeRef.current = 0;
    setIsSessionActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
  };

  const toggleSession = () => {
    const newState = !isSessionActive;
    setShouldSendFrames(newState);
    setIsSessionActive(newState);
    if (newState) {
      setTimeout(captureAndSendFrame, 2300);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    // Connect to the agent before starting the countdown
    conversation.startSession();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          if (prev === 0) {
            startSession();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener("ended", () => {
      setIsAudioPlaying(false);
      URL.revokeObjectURL(audioRef.current?.src || "");
      if (shouldSendFrames) {
        captureAndSendFrame();
      }
    });

    return () => {
      conversation.endSession();
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log("isSpeaking", conversation.isSpeaking);
  }, [conversation.isSpeaking]);

  // Effect to handle frame capture when shouldSendFrames changes
  useEffect(() => {
    if (shouldSendFrames && !isAudioPlaying) {
      const frameInterval = setInterval(captureAndSendFrame, 2300);
      return () => clearInterval(frameInterval);
    }
  }, [shouldSendFrames, isAudioPlaying]);

  return (
    <div className="mx-auto max-w-6xl">
      {cameraError && (
        <Alert
          variant="destructive"
          className="mb-4 border border-red-800 bg-red-950/50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{cameraError}</AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-800 shadow-inner">
        {!isCameraActive && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-900/90">
            <Camera className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-sm font-medium">Camera is currently disabled</p>
          </div>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="flex flex-col items-center">
              <span className="text-8xl font-bold text-white animate-pulse mb-4">
                {countdown === 0 ? "GO!" : countdown}
              </span>
              <span className="text-xl text-gray-300">
                {countdown === 0 ? "Starting session..." : "Get ready..."}
              </span>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        <div className="absolute top-4 left-4 flex gap-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isCameraActive ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-400">
                {isCameraActive ? "Camera Active" : "Camera Off"}
              </span>
            </div>
            {isSessionActive && (
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-400">Session Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-3">
          {!isCameraActive && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg"
              onClick={startCamera}
            >
              <Camera className="mr-2 h-4 w-4" />
              Enable Camera
            </Button>
          )}

          {isCameraActive && !isSessionActive && !countdown && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-all duration-200 shadow-lg"
              onClick={startCountdown}
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          )}

          {isSessionActive && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={toggleSession}
              >
                {isSessionActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={stopSession}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {permissionState === "denied" && (
        <div className="mt-4 p-3 bg-yellow-950/30 border border-yellow-800/50 rounded-lg">
          <p className="text-yellow-500 text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Camera access is blocked. Please update your browser settings to
            allow camera access.
          </p>
        </div>
      )}
    </div>
  );
}
