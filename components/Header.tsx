
import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  activeView: AppView;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView }) => {
  const titles: Record<AppView, string> = {
    [AppView.CHAT]: 'AI Intelligence Studio',
    [AppView.IMAGE]: 'Creative Image Generation',
    [AppView.VIDEO]: 'Nova Veo Video Cinema',
    [AppView.SPEECH]: 'Neural Text-to-Speech',
    [AppView.LIVE]: 'Real-time Conversational AI'
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-200">{titles[activeView]}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Gemini 3 Flash Pro
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <i className="fas fa-user-circle"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
