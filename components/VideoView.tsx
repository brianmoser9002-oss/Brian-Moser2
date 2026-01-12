
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedVideo } from '../types';

const VideoView: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [video, setVideo] = useState<GeneratedVideo | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume success as per instructions
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatus('Initializing cinematic generation...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus('Dreaming up frames... (this may take 1-2 minutes)');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        const vidResponse = await fetch(fetchUrl);
        const blob = await vidResponse.blob();
        const url = URL.createObjectURL(blob);

        setVideo({
          id: Date.now().toString(),
          url,
          prompt,
          timestamp: Date.now()
        });
      }
    } catch (error: any) {
      console.error("Video error:", error);
      if (error?.message?.includes('Requested entity was not found')) {
        setHasKey(false);
      }
      alert("Failed to generate video. Ensure your API key is from a paid project.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
          <i className="fas fa-key text-red-500 text-2xl"></i>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">API Key Required</h2>
          <p className="text-slate-400 text-sm">
            Cinematic video generation requires a paid Google AI Studio API key. 
            Select your key to continue.
          </p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            Learn about billing →
          </a>
        </div>
        <button
          onClick={handleSelectKey}
          className="px-8 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Video Concept</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Cinematic drone shot of a hidden temple in the Andes mountains, golden hour lighting..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none h-32"
        />
        <button
          onClick={generateVideo}
          disabled={!prompt.trim() || isGenerating}
          className="mt-6 w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <i className="fas fa-clapperboard animate-pulse"></i>
              <span>{status}</span>
            </>
          ) : (
            <>
              <i className="fas fa-video"></i>
              <span>Generate Cinematic Video</span>
            </>
          )}
        </button>
      </div>

      {video && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <video src={video.url} controls className="w-full h-auto max-h-[600px] bg-black" />
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Result: {video.prompt}</h3>
            <p className="text-xs text-slate-500">Generated with Veo 3.1 Fast</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoView;
