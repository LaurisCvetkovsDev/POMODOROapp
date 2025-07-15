import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Friend data structure
export interface Friend {
  id: string
  name: string
  pomodoros: number
}

// Pomodoro session data structure
export interface PomodoroSession {
  id?: string
  startTime: Date
  actualMinutesWorked: number
  isCompleted: boolean
  type: 'work' | 'break'
}

// Main state structure for Pomodoro app
export interface PomodoroState {
  // Counters and goals
  dailyCount: number                    // Daily Pomodoro count
  totalCount: number                    // Total Pomodoro count
  dailyGoal: number                     // Daily goal
  completedMinutes: number              // Completed minutes until next Pomodoro
  
  // Timer state
  isWorkPhase: boolean                  // Whether it's work phase (true) or break (false)
  workDuration: number                  // Work session duration in minutes
  shortBreakDuration: number            // Short break duration in minutes
  
  // Additional functionality
  friends: Friend[]                     // Friends list
  isCompleted: boolean                  // Whether current session is completed
  selectedSound: string                 // Selected completion sound
  currentSession: PomodoroSession | null // Current active session
  lastResetDate: string                 // Last reset date key
  goalReachedToday: boolean             // Whether daily goal is reached today
  
  // Functions for counter management
  incrementCount: (minutes: number) => void
  resetDailyCount: () => void
  setDailyGoal: (goal: number) => void
  setGoalReachedToday: (reached: boolean) => void
  
  // Functions for timer settings management
  setWorkDuration: (duration: number) => void
  setShortBreakDuration: (duration: number) => void
  togglePhase: () => void
  
  // Functions for friends management
  addFriend: (name: string) => void
  deleteFriend: (id: string) => void
  updateFriendPomodoros: (id: string, pomodoros: number) => void
  
  // Functions for session state management
  setCompleted: (completed: boolean) => void
  setSelectedSound: (sound: string) => void
  startSession: (type: 'work' | 'break') => void
  endSession: (actualMinutesWorked: number, isCompleted: boolean) => PomodoroSession
  clearCurrentSession: () => void
  checkAndResetDaily: () => void
}

// Helper function to get today's date key (format: YYYY-MM-DD-HH)
const getTodayResetKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}-00`;
};

// Main Zustand store with persistent data storage
export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      // Initial state values
      dailyCount: 0,
      totalCount: 0,
      dailyGoal: 5,
      completedMinutes: 0,
      isWorkPhase: true,
      workDuration: 25,
      shortBreakDuration: 5,
      friends: [],
      isCompleted: false,
      selectedSound: "POMODOROdone2-1.mp3",
      currentSession: null,
      lastResetDate: getTodayResetKey(),
      goalReachedToday: false,

      // Increase Pomodoro counter when session is completed
      incrementCount: (minutes) => set((state) => {
        const totalCompletedMinutes = state.completedMinutes + minutes;
        const POMODORO_MINUTES = 25;
        const newPomodoros = Math.floor(totalCompletedMinutes / POMODORO_MINUTES);
        const remainingMinutes = totalCompletedMinutes % POMODORO_MINUTES;
        
        console.log(`DEBUG: Store incrementCount - accepting ${minutes} minutes, new pomodoros: ${newPomodoros}`);
        
        return {
          dailyCount: state.dailyCount + newPomodoros,
          totalCount: state.totalCount + newPomodoros,
          completedMinutes: remainingMinutes
        };
      }),

      // Reset daily counter (automatically every day)
      resetDailyCount: () => set({ dailyCount: 0, completedMinutes: 0, goalReachedToday: false }),
      
      // Set daily goal
      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      // Set whether daily goal is reached
      setGoalReachedToday: (reached) => set({ goalReachedToday: reached }),
      
      // Set work and break durations
      setWorkDuration: (duration) => set({ workDuration: duration }),
      setShortBreakDuration: (duration) => set({ shortBreakDuration: duration }),
      
      // Toggle between work and break phases
      togglePhase: () => set((state) => ({ isWorkPhase: !state.isWorkPhase })),
      
      // Add new friend to list
      addFriend: (name) => set((state) => ({
        friends: [...state.friends, {
          id: Date.now().toString(),
          name,
          pomodoros: 0
        }]
      })),
      
      // Delete friend from list
      deleteFriend: (id) => set((state) => ({
        friends: state.friends.filter(friend => friend.id !== id)
      })),
      
      // Update friend's Pomodoro count
      updateFriendPomodoros: (id, pomodoros) => set((state) => ({
        friends: state.friends.map(friend => 
          friend.id === id ? { ...friend, pomodoros } : friend
        )
      })),
      
      // Set session completion state
      setCompleted: (completed) => set({ isCompleted: completed }),
      
      // Set selected completion sound
      setSelectedSound: (sound) => set({ selectedSound: sound }),

      // Start new Pomodoro session (work or break)
      startSession: (type) => set(() => ({
        currentSession: {
          startTime: new Date(),
          actualMinutesWorked: 0,
          isCompleted: false,
          type
        }
      })),

      // End current session and return its data
      endSession: (actualMinutesWorked, isCompleted) => {
        const state = get();
        const session = state.currentSession;
        
        if (!session) {
          return { startTime: new Date(), actualMinutesWorked: 0, isCompleted: false, type: 'work' as const };
        }
        
        const completedSession: PomodoroSession = {
          ...session,
          actualMinutesWorked,
          isCompleted
        };

        set({ currentSession: null });
        return completedSession;
      },

      // Clear current active session
      clearCurrentSession: () => set({ currentSession: null }),

      // Check and reset daily counter if new day has started
      checkAndResetDaily: () => {
        const currentResetKey = getTodayResetKey();
        const state = get();
        
        if (state.lastResetDate !== currentResetKey) {
          set({
            dailyCount: 0,
            completedMinutes: 0,
            goalReachedToday: false,
            lastResetDate: currentResetKey
          });
        }
      }
    }),
    {
      // Persistent storage configuration
      name: 'pomodoro-storage',
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Hydration error:', error);
          } else if (state) {
            // Clear active session on app reload
              state.currentSession = null;
          }
        };
      }
    }
  )
) 