import { useState, useEffect, useCallback, useRef } from "react";

// WebSocket Message Types
interface ConversationInitiationClientData {
  type: "conversation_initiation_client_data";
  conversation_config_override?: {
    agent?: {
      prompt?: {
        prompt: string;
      };
      first_message?: string;
      language?: string;
    };
    tts?: {
      voice_id: string;
    };
  };
  custom_llm_extra_body?: {
    temperature?: number;
    max_tokens?: number;
  };
  dynamic_variables?: Record<string, string>;
}

interface ConversationInitiationMetadata {
  type: "conversation_initiation_metadata";
  conversation_initiation_metadata_event: {
    conversation_id: string;
    agent_output_audio_format: string;
    user_input_audio_format: string;
  };
}

interface UserTranscript {
  type: "user_transcript";
  user_transcription_event: {
    user_transcript: string;
  };
}

interface AgentResponse {
  type: "agent_response";
  agent_response_event: {
    agent_response: string;
  };
}

interface AudioResponse {
  type: "audio";
  audio_event: {
    audio_base_64: string;
    event_id: number;
  };
}

interface PingEvent {
  type: "ping";
  ping_event: {
    event_id: number;
    ping_ms: number;
  };
}

interface PongEvent {
  type: "pong";
  event_id: number;
}

interface ClientToolCall {
  type: "client_tool_call";
  client_tool_call: {
    tool_name: string;
    tool_call_id: string;
    parameters: Record<string, any>;
  };
}

interface ClientToolResult {
  type: "client_tool_result";
  tool_call_id: string;
  result: string;
  is_error: boolean;
}

interface InternalVadScore {
  type: "internal_vad_score";
  vad_event: {
    score: number;
  };
}

interface InternalTurnProbability {
  type: "internal_turn_probability";
  turn_event: {
    probability: number;
  };
}

interface InternalTentativeAgentResponse {
  type: "internal_tentative_agent_response";
  tentative_agent_response_internal_event: {
    tentative_agent_response: string;
  };
}

type WebSocketIncomingMessage =
  | ConversationInitiationMetadata
  | UserTranscript
  | AgentResponse
  | AudioResponse
  | PingEvent
  | ClientToolCall
  | InternalVadScore
  | InternalTurnProbability
  | InternalTentativeAgentResponse;

type WebSocketOutgoingMessage =
  | ConversationInitiationClientData
  | PongEvent
  | ClientToolResult
  | { user_audio_chunk: string };

interface ToolCallState {
  isLoading: boolean;
  toolName: string | null;
  toolCallId: string | null;
  parameters: Record<string, any> | null;
  error: string | null;
}

interface UseElevenLabsWebSocketProps {
  agentId: string;
  config?: {
    prompt?: string;
    firstMessage?: string;
    language?: string;
    voiceId?: string;
    temperature?: number;
    maxTokens?: number;
  };
  dynamicVariables?: Record<string, string>;
  onMessage?: (message: WebSocketIncomingMessage) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  onToolCall?: (
    toolName: string,
    toolCallId: string,
    parameters: Record<string, any>
  ) => Promise<string>;
}

export const useElevenLabsWebSocket = ({
  agentId,
  config,
  dynamicVariables,
  onMessage,
  onError,
  onClose,
  onToolCall,
}: UseElevenLabsWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [toolCallState, setToolCallState] = useState<ToolCallState>({
    isLoading: false,
    toolName: null,
    toolCallId: null,
    parameters: null,
    error: null,
  });

  const connect = useCallback(async () => {
    try {
      // Get the signed URL from our API
      const response = await fetch(`/api/elevenlabs/ws?agent_id=${agentId}`);
      console.log("response", response);
      if (!response.ok) {
        throw new Error("Failed to get WebSocket URL");
      }

      const { url } = await response.json();

      // Create WebSocket connection using the signed URL
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Send initial configuration
        const initData: ConversationInitiationClientData = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              ...(config?.prompt && {
                prompt: { prompt: config.prompt },
              }),
              ...(config?.firstMessage && {
                first_message: config.firstMessage,
              }),
              ...(config?.language && { language: config.language }),
            },
            ...(config?.voiceId && {
              tts: { voice_id: config.voiceId },
            }),
          },
          ...(config?.temperature || config?.maxTokens
            ? {
                custom_llm_extra_body: {
                  ...(config?.temperature && {
                    temperature: config.temperature,
                  }),
                  ...(config?.maxTokens && {
                    max_tokens: config.maxTokens,
                  }),
                },
              }
            : {}),
          ...(dynamicVariables && { dynamic_variables: dynamicVariables }),
        };

        ws.send(JSON.stringify(initData));
      };

      ws.onmessage = async (event) => {
        try {
          // Handle binary messages (audio)
          if (event.data instanceof Blob) {
            onMessage?.({
              type: "audio",
              audio_event: {
                audio_base_64: await blobToBase64(event.data),
                event_id: Date.now(),
              },
            });
            return;
          }

          const data: WebSocketIncomingMessage = JSON.parse(event.data);

          // Handle conversation initiation
          if (data.type === "conversation_initiation_metadata") {
            setConversationId(
              data.conversation_initiation_metadata_event.conversation_id
            );
          }

          // Handle ping events
          if (data.type === "ping") {
            const pongResponse: PongEvent = {
              type: "pong",
              event_id: data.ping_event.event_id,
            };
            ws.send(JSON.stringify(pongResponse));
          }

          // Handle tool calls
          if (data.type === "client_tool_call" && onToolCall) {
            try {
              setToolCallState({
                isLoading: true,
                toolName: data.client_tool_call.tool_name,
                toolCallId: data.client_tool_call.tool_call_id,
                parameters: data.client_tool_call.parameters,
                error: null,
              });

              const result = await onToolCall(
                data.client_tool_call.tool_name,
                data.client_tool_call.tool_call_id,
                data.client_tool_call.parameters
              );

              const toolResponse: ClientToolResult = {
                type: "client_tool_result",
                tool_call_id: data.client_tool_call.tool_call_id,
                result,
                is_error: false,
              };
              ws.send(JSON.stringify(toolResponse));

              setToolCallState({
                isLoading: false,
                toolName: null,
                toolCallId: null,
                parameters: null,
                error: null,
              });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Tool call failed";
              const toolResponse: ClientToolResult = {
                type: "client_tool_result",
                tool_call_id: data.client_tool_call.tool_call_id,
                result: errorMessage,
                is_error: true,
              };
              ws.send(JSON.stringify(toolResponse));

              setToolCallState({
                isLoading: false,
                toolName: data.client_tool_call.tool_name,
                toolCallId: data.client_tool_call.tool_call_id,
                parameters: data.client_tool_call.parameters,
                error: errorMessage,
              });
            }
          }

          // Forward message to callback
          onMessage?.(data);
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
          onError?.(err);
        }
      };

      ws.onerror = (event) => {
        const errorMessage = "WebSocket error occurred";
        setError(errorMessage);
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConversationId(null);
        onClose?.();
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      onError?.(err);
    }
  }, [
    agentId,
    config,
    dynamicVariables,
    onMessage,
    onError,
    onClose,
    onToolCall,
  ]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: message }));
    } else {
      setError("WebSocket is not connected");
    }
  }, []);

  const sendAudioChunk = useCallback((audioData: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          user_audio_chunk: audioData,
        })
      );
    } else {
      setError("WebSocket is not connected");
    }
  }, []);

  // Helper function to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    error,
    conversationId,
    connect,
    disconnect,
    sendMessage,
    sendAudioChunk,
    toolCallState,
  };
};
