
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt,
          timestamp: Date.now()
        };
        setImages(prev => [newImg, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error("Image gen error:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Prompt Inspiration</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic solarpunk city with floating gardens and crystal waterfalls..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            >
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Cinema</option>
              <option value="9:16">9:16 Mobile</option>
              <option value="4:3">4:3 Standard</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={generateImage}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Forging Your Vision...</span>
            </>
          ) : (
            <>
              <i className="fas fa-wand-magic-sparkles"></i>
              <span>Generate Image</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
              <p className="text-xs text-slate-300 line-clamp-2 italic mb-3">"{img.prompt}"</p>
              <div className="flex gap-2">
                <a 
                  href={img.url} 
                  download="nova-gen.png"
                  className="flex-1 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white py-2 rounded-lg text-center text-xs transition-all"
                >
                  <i className="fas fa-download mr-2"></i> Save
                </a>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && !isGenerating && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700 border border-slate-800">
              <i className="fas fa-image text-3xl"></i>
            </div>
            <p className="text-slate-500">No images generated yet. Start dreaming!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;
