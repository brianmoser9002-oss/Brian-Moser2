
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const SpeechView: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const synthesizeSpeech = async () => {
    if (!text.trim() || isSynthesizing) return;

    setIsSynthesizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = audioContext.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (error) {
      console.error("TTS error:", error);
      alert("Failed to synthesize speech.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Neural Voice</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {voices.map(voice => (
              <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={`py-2 px-4 rounded-xl text-xs font-medium border transition-all ${
                  selectedVoice === voice 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-green-500/50'
                }`}
              >
                {voice}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Speech Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Welcome to Nova AI. Experience the future of human-machine interaction through crystal clear neural synthesis."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none h-40"
          />
        </div>

        <button
          onClick={synthesizeSpeech}
          disabled={!text.trim() || isSynthesizing}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {isSynthesizing ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <i className="fas fa-play"></i>
              <span>Speak Text</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-500">
          <i className="fas fa-info-circle"></i>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-1">High Fidelity Audio</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our voices are trained on diverse datasets to provide expressive, emotional, and natural-sounding results for podcasts, narrations, and assistants.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpeechView;
