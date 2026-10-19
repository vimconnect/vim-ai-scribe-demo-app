import { useCallback } from "react";
import { useState, useEffect } from "react";
import { useVimSdkContext } from "@/providers/VimSdkContext";

export const useRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const vimSdk = useVimSdkContext();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const simulateRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(stream);
      // Show the Vim Hub microphone badge to indicate active recording
      vimSdk?.hub?.microphoneBadge?.show?.();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch {
      // Hide the badge if access is denied or an error occurs
      vimSdk?.hub?.microphoneBadge?.hide?.();
      console.error("Microphone access denied or error occurred.");
    }
  }, [vimSdk]);

  // Allowing the microphone the first time reloads the app; resume the recording that asked.
  useEffect(() => {
    const hub = vimSdk?.hub as { consumeGrantedDevices?: () => string[] } | undefined;
    if (hub?.consumeGrantedDevices?.().includes("microphone")) void simulateRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on the first mount after the reload
  }, []);

  const stopRecording = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    // Hide the Vim Hub microphone badge when recording stops
    vimSdk?.hub?.microphoneBadge?.hide?.();
  }, [vimSdk, stream]);

  return {
    isPaused,
    setIsPaused,
    isRecording,
    setIsRecording,
    recordingTime,
    simulateRecording,
    stopRecording,
  };
};
