import { User, PomodoroSession, Friend } from '../types';

const API_URL = import.meta.env.VITE_API_URL;
    


// Auth Services
export const authService = {
    async register(username: string, email: string, password: string): Promise<User> {
        const response = await fetch(`${API_URL}/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.user;
    },

    async login(email: string, password: string): Promise<User> {
        const response = await fetch(`${API_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.user;
    },

    async resetPassword(email: string, newPassword: string): Promise<void> {
        const response = await fetch(`${API_URL}/reset-password.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, newPassword }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset password');
        }

        return await response.json();
    },
};

// Pomodoro Session Services
export const sessionService = {
    async createSession(session: Omit<PomodoroSession, 'id'>): Promise<PomodoroSession> {
        const response = await fetch(`${API_URL}/create_session.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(session),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.session;
    },

    async getSessions(userId: number): Promise<PomodoroSession[]> {
        const response = await fetch(`${API_URL}/get_sessions.php?user_id=${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.sessions;
    },
};

// Friend Services
export const friendService = {
    async addFriend(userId: number, friendUsername: string): Promise<Friend> {
        const response = await fetch(`${API_URL}/friend_actions.php?action=add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                friend_username: friendUsername,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.friend;
    },

    async acceptFriend(userId: number, friendshipId: number): Promise<Friend> {
        const response = await fetch(`${API_URL}/friend_actions.php?action=accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                friendship_id: friendshipId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.friend;
    },

    async removeFriend(userId: number, friendshipId: number): Promise<void> {
        const response = await fetch(`${API_URL}/friend_actions.php?action=remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                friendship_id: friendshipId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
    },

    async getFriends(userId: number): Promise<Friend[]> {
        // Ensure userId is an integer
        const userIdInt = parseInt(userId.toString());
        // Add cache-busting timestamp to force fresh requests
        const timestamp = Date.now();
        const response = await fetch(`${API_URL}/friend_actions.php?action=list&user_id=${userIdInt}&_t=${timestamp}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },
};

// New service for Pomodoro Sessions
export const pomodoroSessionService = {
    createSession: async (sessionData: { user_id: number; start_time: string; end_time: string; duration: number; is_completed: boolean }) => {
        try {
            const response = await fetch(`${API_URL}/create_session.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create pomodoro session');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating pomodoro session:', error);
            throw error;
        }
    },
    // Add other pomodoro session related functions here if needed
};

// New service for real-time user data from database
export const userStatsService = {
    // Get today's pomodoro count and total count from database
    async getUserCounts(userId: number): Promise<{ daily_pomodoros: number; total_pomodoros: number }> {
        try {
            const response = await fetch(`${API_URL}/friend_actions.php?action=get_user_counts&user_id=${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user counts');
            }
            
            const data = await response.json();
            
            return {
                daily_pomodoros: parseInt(data.daily_pomodoros) || 0,
                total_pomodoros: parseInt(data.total_pomodoros) || 0
            };
        } catch (error) {
            console.error('Error fetching user counts:', error);
            return { daily_pomodoros: 0, total_pomodoros: 0 };
        }
    },

    // Get today's detailed activity from database
    async getTodayActivity(userId: number): Promise<{ count: number; total_duration: number; completion_rate: number }> {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const response = await fetch(`${API_URL}/analytics.php?action=daily_activity&user_id=${userId}&start_date=${today}&end_date=${today}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch today activity');
            }
            
            const data = await response.json();
            const todayData = data.find((item: any) => item.date === today);
            
            return {
                count: parseInt(todayData?.count) || 0,
                total_duration: parseFloat(todayData?.total_duration) || 0,
                completion_rate: parseFloat(todayData?.completion_rate) || 0
            };
        } catch (error) {
            console.error('Error fetching today activity:', error);
            return { count: 0, total_duration: 0, completion_rate: 0 };
        }
    }
};