"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, StopCircle, Play, Pause, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function WorkoutSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameDelayMs = 1000; // 1 second delay between frames

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logMessage("Already connected");
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      wsRef.current = new WebSocket(
        "ws://localhost:8000/ws/video-stream/session-1"
      );

      wsRef.current.onopen = () => {
        setIsConnected(true);
        logMessage("Connected to workout session");

        // If we were streaming before disconnection, restart the session
        if (isStreaming && isSessionActive) {
          wsRef.current?.send(
            JSON.stringify({
              type: "start_session",
              active: true,
            })
          );
          logMessage("Restored session state after reconnection");
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        logMessage(`Disconnected from workout session (code: ${event.code})`);

        // Only stop streaming if this was an intentional close
        if (event.code === 1000) {
          setIsStreaming(false);
          setIsSessionActive(false);
          stopVideoStream();
        } else {
          // Attempt to reconnect after 2 seconds if this wasn't an intentional close
          logMessage("Connection lost. Attempting to reconnect...");
          setTimeout(connect, 2000);
        }
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (error) => {
        logMessage("WebSocket Error: " + error.type);
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      logMessage("Connection Error: " + error);
      console.error("Connection error:", error);
      // Attempt to reconnect after 2 seconds
      setTimeout(connect, 2000);
    }
  };

  const disconnect = () => {
    stopVideoStream();
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Session ended");
      }
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setIsSessionActive(false);
  };

  const checkCameraPermission = async () => {
    try {
      // Check if the browser supports the permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setPermissionState(result.state);

        // Listen for permission changes
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
      // Some browsers might not support the permissions API
      console.log("Permissions API not supported");
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);

      // First check if we have permission
      await checkCameraPermission();

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
      logMessage("Camera started successfully");
    } catch (error: any) {
      let errorMessage = "Error accessing camera";

      // Handle specific error cases
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
      logMessage(`Error: ${errorMessage}`);
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
    logMessage("Camera stopped");
  };

  const startVideoStream = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logMessage("Reconnecting before starting stream...");
      connect();
      // Wait for connection before starting stream
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          initiateStream();
        } else {
          logMessage("Failed to connect. Please try again.");
        }
      }, 1000);
      return;
    }

    initiateStream();
  };

  const initiateStream = () => {
    if (!streamRef.current) {
      logMessage("Please start the camera first");
      return;
    }

    setIsStreaming(true);
    setIsSessionActive(true);

    // Send start session message with active status
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "start_session",
          active: true,
        })
      );
      logMessage("Sent start_session message");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 640;
    canvas.height = 480;

    const sendFrame = () => {
      const now = Date.now();

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        logMessage("Connection lost. Attempting to reconnect...");
        connect();
        return;
      }

      // Only send frame if enough time has passed and we're not playing audio
      if (
        isSessionActive &&
        streamRef.current?.active &&
        videoRef.current &&
        ctx &&
        !isAudioPlaying &&
        now - lastFrameTimeRef.current >= frameDelayMs
      ) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(blob);
                lastFrameTimeRef.current = now;
                logMessage("Frame sent");
              }
            },
            "image/jpeg",
            0.8
          );
        } catch (error) {
          console.error("Error capturing frame:", error);
          logMessage("Error capturing frame: " + error);
        }
      }

      // Continue the frame loop
      if (isStreaming) {
        frameLoopRef.current = requestAnimationFrame(sendFrame);
      }
    };

    // Start the frame loop
    frameLoopRef.current = requestAnimationFrame(sendFrame);
    logMessage("Started streaming workout session");
  };

  const stopVideoStream = () => {
    // Cancel the animation frame if it exists
    if (frameLoopRef.current !== null) {
      cancelAnimationFrame(frameLoopRef.current);
      frameLoopRef.current = null;
    }

    // Send stop session message
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "stop_session",
          active: false,
        })
      );
    }

    setIsStreaming(false);
    setIsSessionActive(false);
    lastFrameTimeRef.current = 0;
    logMessage("Stopped streaming workout session");
  };

  const pauseSession = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "pause_session",
          active: false,
        })
      );
    }
    setIsSessionActive(false);
    lastFrameTimeRef.current = 0;
    logMessage("Paused workout session");
  };

  const resumeSession = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "resume_session",
          active: true,
        })
      );
    }
    setIsSessionActive(true);
    lastFrameTimeRef.current = 0; // Reset to allow immediate frame send
    logMessage("Resumed workout session");
  };

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          if (prev === 0) {
            startVideoStream();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.data instanceof Blob) {
      handleAudioFeedback(event.data);
    } else {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "error") {
          logMessage(`Error: ${data.data}`);
        } else {
          logMessage(data.message || JSON.stringify(data));
        }
      } catch (e) {
        logMessage("Received: " + event.data);
      }
    }
  };

  const handleAudioFeedback = (blob: Blob) => {
    const audioPlayer = document.getElementById(
      "audioPlayer"
    ) as HTMLAudioElement;

    if (audioPlayer) {
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
      audioPlayer.style.display = "none";
      audioPlayer.volume = 1.0;
      audioPlayer.muted = false;

      const startAudioPlayback = () => {
        setIsAudioPlaying(true);
        lastFrameTimeRef.current = Date.now(); // Reset frame timer
        audioPlayer.play().catch((error) => {
          console.error("Error playing audio:", error);
          logMessage("Failed to play audio feedback");
          setIsAudioPlaying(false);
        });
      };

      audioPlayer.oncanplay = startAudioPlayback;

      audioPlayer.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsAudioPlaying(false);
        lastFrameTimeRef.current = 0; // Reset frame timer to allow immediate next frame
      };

      audioPlayer.onerror = (e) => {
        const error = e as ErrorEvent;
        URL.revokeObjectURL(audioUrl);
        console.error("Error with audio playback:", error);
        logMessage("Error playing audio feedback");
        setIsAudioPlaying(false);
        lastFrameTimeRef.current = 0; // Reset frame timer
      };
    } else {
      console.error("Audio player element not found");
      logMessage("Audio player not initialized");
    }
  };

  const logMessage = (message: string) => {
    const feedbackLog = document.getElementById("feedbackLog");
    if (feedbackLog) {
      const timestamp = new Date().toLocaleTimeString();
      const messageElement = document.createElement("p");
      messageElement.className = "text-sm text-gray-300";
      messageElement.textContent = `[${timestamp}] ${message}`;
      feedbackLog.appendChild(messageElement);
      feedbackLog.scrollTop = feedbackLog.scrollHeight;
    }
  };

  useEffect(() => {
    // Initialize audio context on component mount
    const initAudio = async () => {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        await audioContext.resume();
        logMessage("Audio context initialized");
      } catch (error) {
        console.error("Error initializing audio:", error);
        logMessage("Failed to initialize audio context");
      }
    };

    initAudio();
    connect();

    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    // Cleanup function to ensure we cancel any ongoing animation frame
    return () => {
      if (frameLoopRef.current !== null) {
        cancelAnimationFrame(frameLoopRef.current);
        frameLoopRef.current = null;
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6 border-2 border-gray-800 shadow-lg max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Workout Session
          </h2>
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
            {isStreaming && (
              <div className="flex items-center space-x-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isSessionActive
                      ? "bg-green-500 animate-pulse"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {isSessionActive ? "Session Active" : "Session Paused"}
                </span>
              </div>
            )}
          </div>
        </div>

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
              <p className="text-sm font-medium">
                Camera is currently disabled
              </p>
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

          <div className="absolute top-4 right-4 flex gap-3">
            {!isCameraActive && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={startCamera}
              >
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera
              </Button>
            )}

            {isCameraActive && !isStreaming && !countdown && (
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

            {isStreaming && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 hover:scale-105 transition-all duration-200 shadow-lg"
                  onClick={isSessionActive ? pauseSession : resumeSession}
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
                  onClick={stopVideoStream}
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

        <div className="mt-6 bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">
            Real-time Feedback
          </h3>
          <div
            className="h-[250px] overflow-y-auto space-y-2 custom-scrollbar pr-2"
            id="feedbackLog"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#4B5563 #1F2937",
            }}
          >
            <p className="text-gray-400">Waiting to start session...</p>
          </div>
        </div>

        <audio
          id="audioPlayer"
          className="hidden"
          autoPlay
          playsInline
          preload="auto"
        />
      </Card>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
