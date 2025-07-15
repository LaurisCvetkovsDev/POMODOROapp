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