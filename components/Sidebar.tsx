
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, toggleOpen }) => {
  const menuItems = [
    { id: AppView.CHAT, icon: 'fa-comments', label: 'AI Chat', color: 'text-blue-400' },
    { id: AppView.IMAGE, icon: 'fa-image', label: 'Image Studio', color: 'text-purple-400' },
    { id: AppView.VIDEO, icon: 'fa-film', label: 'Cinematic Video', color: 'text-red-400' },
    { id: AppView.SPEECH, icon: 'fa-microphone-lines', label: 'Voice Canvas', color: 'text-green-400' },
    { id: AppView.LIVE, icon: 'fa-bolt', label: 'Nova Live', color: 'text-yellow-400' },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col z-50`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <i className="fas fa-sparkles text-white text-sm"></i>
        </div>
        {isOpen && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Nova AI</h1>}
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              activeView === item.id 
                ? 'bg-slate-800 text-white shadow-lg shadow-black/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6 ${activeView === item.id ? item.color : ''}`}></i>
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={toggleOpen}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all"
        >
          <i className={`fas ${isOpen ? 'fa-chevron-left' : 'fa-chevron-right'} w-6`}></i>
          {isOpen && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
