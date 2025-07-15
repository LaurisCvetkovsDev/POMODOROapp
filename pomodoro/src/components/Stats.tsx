import React, { useState, useEffect } from "react";
import { usePomodoroStore } from "../store/pomodoroStore";
import { useAuth } from "../contexts/AuthContext";
import { userStatsService } from "../services/api";
import StatsDashboard from "./Analytics/StatsDashboard";
import ActivityHeatmapWrapper from "./Analytics/ActivityHeatmapWrapper";
import ProductivityCharts from "./Analytics/ProductivityCharts";
import gif102401 from "../assets/000102401.gif";

const Stats = () => {
  const { totalCount, dailyGoal, isCompleted } = usePomodoroStore();
  const { user } = useAuth();

  // State for database data
  const [dailyCount, setDailyCount] = useState(0);
  const [databaseTotalCount, setDatabaseTotalCount] = useState(0);

  const [dailyGoalStreak, setDailyGoalStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "heatmap">(
    "overview"
  );

  // Function to fetch today's data from database
  const fetchTodayData = async () => {
    if (!user) {
      setDailyCount(0);
      setDatabaseTotalCount(0);
      return;
    }

    try {
      const data = await userStatsService.getUserCounts(
        parseInt(user.id.toString())
      );
      setDailyCount(data.daily_pomodoros);
      setDatabaseTotalCount(data.total_pomodoros);
    } catch (error) {
      console.error("Failed to fetch today data:", error);
      setDailyCount(0);
      setDatabaseTotalCount(0);
    }
  };

  // Fetch today's data when component mounts or user changes
  useEffect(() => {
    fetchTodayData();
  }, [user]);

  // Refetch today's data when a pomodoro is completed
  useEffect(() => {
    if (isCompleted && user) {
      // Wait a bit for the session to be saved to database
      setTimeout(() => {
        fetchTodayData();
      }, 1000);
    }
  }, [isCompleted, user]);

  // Calculate some basic statistics
  const goalCompletionRate =
    dailyGoal > 0 ? Math.round((dailyCount / dailyGoal) * 100) : 0;

  // Calculate daily goal streak
  useEffect(() => {
    const calculateStreak = async () => {
      if (!user) {
        setDailyGoalStreak(0);
        return;
      }

      try {
        // For now, we'll calculate a simple streak based on whether today's goal is met
        // In a real implementation, you'd fetch historical data from the backend
        let streak = 0;

        // Check if today's goal is completed (using database data)
        if (dailyCount >= dailyGoal && dailyGoal > 0) {
          streak = 1; // At least today is completed

          // Here you would typically fetch historical data to calculate the actual streak
          // For now, we'll use a placeholder calculation
          // You could extend this to call an API endpoint that returns streak data

          // Placeholder: Add some mock streak calculation
          // In reality, you'd query the database for consecutive days where daily goal was met
          const mockStreakDays =
            Math.floor(databaseTotalCount / dailyGoal) || 0;
          streak = Math.min(mockStreakDays, 30); // Cap at 30 for display purposes
        }

        setDailyGoalStreak(streak);
      } catch (error) {
        console.error("Failed to calculate daily goal streak:", error);
        setDailyGoalStreak(0);
      }
    };

    calculateStreak();
  }, [user, dailyCount, dailyGoal, databaseTotalCount]);

  return (
    <div className="stats">
      <div className="stats-header">
        <h2 className="mb-4">Advanced Analytics</h2>
        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${
              activeTab === "overview" ? "active" : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`analytics-tab ${
              activeTab === "charts" ? "active" : ""
            }`}
            onClick={() => setActiveTab("charts")}
          >
            Charts
          </button>
          <button
            className={`analytics-tab ${
              activeTab === "heatmap" ? "active" : ""
            }`}
            onClick={() => setActiveTab("heatmap")}
          >
            Activity Map
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <StatsDashboard />
        </>
      )}

      {activeTab === "charts" && user && (
        <ProductivityCharts userId={user.id} />
      )}

      {activeTab === "heatmap" && user && (
        <ActivityHeatmapWrapper userId={user.id} />
      )}
    </div>
  );
};

export default Stats;
