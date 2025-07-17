export interface User {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    created_at: string;
    last_login: string;
}

export interface PomodoroSession {
    id: number;
    user_id: number;
    start_time: string;
    end_time: string;
    duration: number;
    is_completed: boolean;
}

export interface Friend {
    id: number;
    user_id: number;
    friend_id: number;
    status: 'pending' | 'accepted';
    created_at: string;
    username?: string;
    avatar_url?: string;
    pomodoros?: number;
    total_pomodoros?: number;
    daily_pomodoros?: number;
}

// Electron API types
interface ElectronAPI {
  checkForUpdates: () => Promise<any>;
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
  onDownloadProgress: (callback: (event: any, progress: any) => void) => void;
  onUpdateDownloaded: (callback: (event: any, info: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
} 