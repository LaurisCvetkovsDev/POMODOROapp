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

// Timer update interface
export interface TimerUpdate {
    timeLeft: number;
    isRunning: boolean;
    isWorkPhase: boolean;
}

// Electron API типы
export interface ElectronAPI {
    // Timer controls
    startTimer: () => void;
    pauseTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
    
    // Timer state updates
    sendTimerUpdate: (timeLeft: number, isRunning: boolean) => void;
    updateTimerSettings: (workDuration: number, breakDuration: number) => void;
    
    // Window controls
    minimizeTimer: () => void;
    restoreTimer: () => void;
    
    // Timer state listeners
    onTimerUpdate: (callback: (timeLeft: number, isRunning: boolean, isWorkPhase: boolean) => void) => void;
    onRestore: (callback: () => void) => void;
    onTimerSync: (callback: (update: TimerUpdate) => void) => void;
    
    // Update controls
    checkForUpdates: () => void;
    downloadUpdate: () => void;
    installUpdate: () => void;
    
    // Update info
    getAppVersion: () => Promise<string>;
    getUpdateInfo: () => Promise<{ version: string; isDev: boolean }>;
    
    // Update status listeners
    onUpdateStatus: (callback: (status: string) => void) => void;
    
    // Remove listener
    removeAllListeners: (channel: string) => void;
}

// Расширение глобального объекта Window
declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
} 