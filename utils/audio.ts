
import { useState, useEffect, useRef } from 'react';

export const useAudioAnalyzer = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSpeakingTime = useRef<number>(0);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsMicOn(true);
      
      analyze();
      return true;
    } catch (e) {
      console.error("Mic Error", e);
      return false;
    }
  };

  const stopAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsMicOn(false);
    setIsSpeaking(false);
  };

  const analyze = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate simple average volume
    let sum = 0;
    for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length;
    
    // Threshold for speaking detection (adjustable)
    if (avg > 15) { 
       lastSpeakingTime.current = Date.now();
       setIsSpeaking(true);
    } else if (Date.now() - lastSpeakingTime.current > 400) {
       // Hold speaking state for 400ms to prevent flickering
       setIsSpeaking(false);
    }
    
    rafRef.current = requestAnimationFrame(analyze);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return { isSpeaking, isMicOn, startAudio, stopAudio };
};
