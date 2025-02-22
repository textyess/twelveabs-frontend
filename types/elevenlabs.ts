export interface ElevenLabsError {
  message: string;
  code?: string;
}

export interface ElevenLabsConversation {
  startSession: (options: any) => Promise<string>;
  endSession: () => Promise<void>;
  setVolume: ({ volume }: { volume: number }) => void;
  getInputByteFrequencyData: () => Uint8Array | undefined;
  startStream: () => void;
  stopStream: () => void;
  isStreaming: boolean;
  isSpeaking: boolean;
  error?: ElevenLabsError;
}
