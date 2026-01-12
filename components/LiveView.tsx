
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const toggleSession = async () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
    }
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.serverContent?.outputTranscription) {
               const text = msg.serverContent.outputTranscription.text;
               setTranscriptions(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'Nova') {
                    return [...prev.slice(0, -1), { role: 'Nova', text: last.text + text }];
                  }
                  return [...prev, { role: 'Nova', text }];
               });
            }
          },
          onerror: () => stopSession(),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: "You are Nova, a witty and fast-talking conversational AI. Keep your answers brief and spoken-word friendly."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
          isActive ? 'bg-yellow-500/20 scale-110 shadow-[0_0_80px_rgba(234,179,8,0.3)]' : 'bg-slate-900 scale-100 shadow-none'
        }`}>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            isActive ? 'bg-yellow-500 animate-pulse' : 'bg-slate-800'
          }`}>
            <i className={`fas ${isActive ? 'fa-bolt' : 'fa-microphone'} text-4xl text-white`}></i>
          </div>
        </div>
        
        {isActive && (
          <div className="absolute -inset-4 rounded-full border border-yellow-500/30 animate-ping"></div>
        )}
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">{isActive ? "Listening and Thinking..." : "Ready to Talk?"}</h2>
        <p className="text-slate-400 max-w-sm mx-auto">
          {isActive 
            ? "Go ahead, ask me anything. I can hear you in real-time."
            : "Engage in a low-latency voice conversation with the latest Gemini model."}
        </p>
      </div>

      <button
        onClick={toggleSession}
        disabled={isConnecting}
        className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 ${
          isActive 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'
        }`}
      >
        {isConnecting ? (
          <i className="fas fa-spinner fa-spin mr-2"></i>
        ) : null}
        {isActive ? "End Session" : "Start Conversation"}
      </button>

      <div className="w-full max-w-xl h-32 overflow-y-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400 font-mono">
        {transcriptions.length > 0 ? (
          transcriptions.map((t, i) => (
            <div key={i} className="mb-2">
              <span className="text-yellow-500">{t.role}:</span> {t.text}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full italic">
            Transcriptions will appear here...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveView;
