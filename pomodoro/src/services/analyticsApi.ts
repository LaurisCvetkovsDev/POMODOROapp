import { format, subDays, startOfDay, endOfDay } from 'date-fns';


const API_URL = import.meta.env.VITE_API_URL;
const TESTING_MODE = false; // Enable analytics for checking

export interface DayActivity {
  date: string;
  count: number;
  total_duration: number;
  completion_rate: number;
}

export interface HourlyActivity {
  hour: number;
  count: number;
  avg_focus_time: number;
}

export interface WeeklyStats {
  week_start: string;
  total_pomodoros: number;
  total_time: number;
  avg_daily: number;
  completion_rate: number;
}

export interface ProductivityTrend {
  date: string;
  productivity_score: number;
  focus_time: number;
  break_time: number;
  efficiency: number;
}

export interface FocusPattern {
  time_of_day: string;
  avg_session_length: number;
  success_rate: number;
  interruption_rate: number;
}

export const analyticsService = {
  // Получить активность по дням (для тепловой карты)
  async getDailyActivity(userId: number, days: number = 365): Promise<DayActivity[]> {
    if (TESTING_MODE) {
      console.log('TESTING MODE: Returning empty daily activity data');
      return [];
    }
    
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      const response = await fetch(`${API_URL}/analytics.php?action=daily_activity&user_id=${userId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`);
      
      if (!response.ok) throw new Error('Failed to fetch daily activity');
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      return [];
    }
  },

  // Получить активность по часам
  async getHourlyActivity(userId: number, days: number = 30): Promise<HourlyActivity[]> {
    if (TESTING_MODE) {
      console.log('TESTING MODE: Returning empty hourly activity data');
      return [];
    }
    
    try {
      const response = await fetch(`${API_URL}/analytics.php?action=hourly_activity&user_id=${userId}&days=${days}`);
      
      if (!response.ok) throw new Error('Failed to fetch hourly activity');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching hourly activity:', error);
      return [];
    }
  },

  // Получить недельную статистику
  async getWeeklyStats(userId: number, weeks: number = 12): Promise<WeeklyStats[]> {
    if (TESTING_MODE) {
      console.log('TESTING MODE: Returning empty weekly stats data');
      return [];
    }
    
    try {
      const response = await fetch(`${API_URL}/analytics.php?action=weekly_stats&user_id=${userId}&weeks=${weeks}`);
      
      if (!response.ok) throw new Error('Failed to fetch weekly stats');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  },

  // Получить тренды продуктивности
  async getProductivityTrends(userId: number, days: number = 30): Promise<ProductivityTrend[]> {
    if (TESTING_MODE) {
      console.log('TESTING MODE: Returning empty productivity trends data');
      return [];
    }
    
    try {
      const response = await fetch(`${API_URL}/analytics.php?action=productivity_trends&user_id=${userId}&days=${days}`);
      
      if (!response.ok) throw new Error('Failed to fetch productivity trends');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching productivity trends:', error);
      return [];
    }
  },

  // Получить паттерны фокуса
  async getFocusPatterns(userId: number): Promise<FocusPattern[]> {
    try {
      const response = await fetch(`${API_URL}/analytics.php?action=focus_patterns&user_id=${userId}`);
      
      if (!response.ok) throw new Error('Failed to fetch focus patterns');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching focus patterns:', error);
      return [];
    }
  },

  // Получить сравнение с друзьями
  async getFriendsComparison(userId: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/analytics.php?action=friends_comparison&user_id=${userId}`);
      
      if (!response.ok) throw new Error('Failed to fetch friends comparison');
      return await response.json();
    } catch (error) {
      console.error('Error fetching friends comparison:', error);
      return { user_rank: 1, total_friends: 0, user_score: 0 };
    }
  }
}; 