
export enum AppView {
  CHAT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  SPEECH = 'speech',
  LIVE = 'live'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
