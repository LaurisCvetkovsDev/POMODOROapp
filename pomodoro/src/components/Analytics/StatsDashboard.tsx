import React, { useState, useEffect } from "react";
import { usePomodoroStore } from "../../store/pomodoroStore";
import { useAuth } from "../../contexts/AuthContext";
import { analyticsService } from "../../services/analyticsApi";
import { userStatsService } from "../../services/api";

import EmptyDataState from "./EmptyDataState";
import "./StatsDashboard.css";
import tomatoGif from "../../assets/000102401.gif";

const StatsDashboard: React.FC = () => {
  const { totalCount, dailyGoal, completedMinutes, isCompleted } =
    usePomodoroStore();
  const { user } = useAuth();

  // State for database data
  const [dailyCount, setDailyCount] = useState(0);
  const [databaseTotalCount, setDatabaseTotalCount] = useState(0);

  const [stats, setStats] = useState({
    weeklyCount: 0,
    monthlyCount: 0,
    streak: 0,
    bestDay: 0,
    averageDaily: 0,
    efficiency: 0,
    totalMinutes: 0,
    weekCompletion: 0,
  });

  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch real data from API
        const [weeklyData, productivityData, dailyData] = await Promise.all([
          analyticsService.getWeeklyStats(user.id, 4), // Last 4 weeks
          analyticsService.getProductivityTrends(user.id, 30), // Last 30 days
          analyticsService.getDailyActivity(user.id, 30), // Last 30 days
        ]);

        // Calculate real statistics
        const weeklyCount = weeklyData.reduce(
          (sum, week) => sum + week.total_pomodoros,
          0
        );
        const monthlyCount = dailyData.reduce((sum, day) => sum + day.count, 0);

        // Calculate streak (consecutive days with activity)
        let streak = 0;
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

        // Use database data for today's count
        if (dailyCount > 0) {
          streak = 1; // Today has activity

          // Go back through API data (excluding today)
          for (let i = dailyData.length - 1; i >= 0; i--) {
            // Skip today since we already counted it
            if (dailyData[i].date === today) continue;

            if (dailyData[i].count > 0) {
              streak++;
            } else {
              break;
            }
          }
        } else {
          // If no activity today, count only API data
          for (let i = dailyData.length - 1; i >= 0; i--) {
            if (dailyData[i].count > 0) {
              streak++;
            } else {
              break;
            }
          }
        }

        // Find best day (including today from database)
        const bestDay = Math.max(
          dailyData.reduce(
            (max, day) => (day.count > max ? day.count : max),
            0
          ),
          dailyCount // Use database data for today
        );

        // Calculate average daily pomodoros (last 7 days, including days with 0)
        const recentDays = dailyData.slice(-7);

        // Count sum for all days (including days with 0 pomodoros)
        let totalCount = recentDays.reduce(
          (sum, day) => sum + (day.count || 0),
          0
        );
        let totalDays = recentDays.length;

        // Add today's data from database
        const todayInData = recentDays.some((day) => day.date === today);
        if (!todayInData) {
          totalDays++;
          totalCount += dailyCount; // Use database data for today
        } else {
          // Replace today's API data with database data
          const todayIndex = recentDays.findIndex((day) => day.date === today);
          if (todayIndex >= 0) {
            totalCount = totalCount - recentDays[todayIndex].count + dailyCount;
          }
        }

        const averageDaily =
          totalDays > 0 ? Math.round(totalCount / totalDays) : 0;

        // Calculate average efficiency (from completed sessions)
        const sessionsWithData = dailyData.filter((day) => day.count > 0);

        let totalEfficiency = sessionsWithData.reduce((sum, day) => {
          const rate = parseFloat(String(day.completion_rate)) || 0;
          return sum + rate;
        }, 0);
        let efficiencyDays = sessionsWithData.length;

        // Always use database data for today's efficiency
        if (dailyCount > 0) {
          const todayApiEfficiencyIndex = sessionsWithData.findIndex(
            (day) => day.date === today
          );

          if (todayApiEfficiencyIndex >= 0) {
            // Replace today's API data with database data (100% efficiency)
            const apiEfficiency =
              parseFloat(
                String(
                  sessionsWithData[todayApiEfficiencyIndex].completion_rate
                )
              ) || 0;
            totalEfficiency = totalEfficiency - apiEfficiency + 100;
          } else {
            // Add today's database data
            efficiencyDays++;
            totalEfficiency += 100;
          }
        }

        const avgEfficiency =
          efficiencyDays > 0 ? Math.round(totalEfficiency / efficiencyDays) : 0;

        // Calculate total work minutes this month
        let totalMinutes = dailyData.reduce((sum, day) => {
          const duration = parseFloat(String(day.total_duration)) || 0;
          return sum + duration;
        }, 0);

        // Always use database data for today's minutes
        const todayApiIndex = dailyData.findIndex((day) => day.date === today);
        const todayLocalMinutes = dailyCount * 25; // 25 minutes per completed pomodoro

        if (todayApiIndex >= 0) {
          // Replace today's API data with database data
          const apiMinutes =
            parseFloat(String(dailyData[todayApiIndex].total_duration)) || 0;
          totalMinutes = totalMinutes - apiMinutes + todayLocalMinutes;
        } else {
          // Add today's database data
          totalMinutes += todayLocalMinutes;
        }

        // Calculate week completion rate
        const weekCompletion =
          weeklyData.length > 0
            ? Math.round(
                weeklyData.reduce(
                  (sum, week) => sum + (week.completion_rate || 0),
                  0
                ) / weeklyData.length
              )
            : 0;

        setStats({
          weeklyCount: isNaN(weeklyCount) ? 0 : Math.round(weeklyCount),
          monthlyCount: isNaN(monthlyCount) ? 0 : Math.round(monthlyCount),
          streak: isNaN(streak) ? 0 : streak,
          bestDay: isNaN(bestDay) ? 0 : bestDay,
          averageDaily: isNaN(averageDaily) ? 0 : averageDaily,
          efficiency: isNaN(avgEfficiency) ? 0 : avgEfficiency,
          totalMinutes: isNaN(totalMinutes) ? 0 : Math.round(totalMinutes),
          weekCompletion: isNaN(weekCompletion) ? 0 : weekCompletion,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set empty stats on error
        setStats({
          weeklyCount: 0,
          monthlyCount: 0,
          streak: 0,
          bestDay: 0,
          averageDaily: 0,
          efficiency: 0,
          totalMinutes: 0,
          weekCompletion: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, dailyCount, completedMinutes, databaseTotalCount]); // Added database data dependencies

  const getGoalProgress = () => {
    if (dailyGoal === 0) return 0;
    return Math.min((dailyCount / dailyGoal) * 100, 100);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (isNaN(efficiency) || efficiency === 0) return "#666666";
    if (efficiency >= 90) return "lightblue";
    if (efficiency >= 75) return "#87cefa";
    if (efficiency >= 60) return "#b0e0e6";
    return "#f85149";
  };

  if (loading) {
    return (
      <div className="stats-dashboard">
        <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
          Loading statistics...
        </div>
      </div>
    );
  }

  // Check if we have any meaningful data
  const hasData =
    stats.weeklyCount > 0 || stats.monthlyCount > 0 || dailyCount > 0;

  if (!hasData) {
    return (
      <div className="stats-dashboard">
        <EmptyDataState
          title="No statistics yet"
          message="Complete your first Pomodoro session to see detailed analytics!"
          icon="📊"
        />
      </div>
    );
  }

  return (
    <div className="stats-dashboard">
      <div className="dashboard-header">
        <h3>Statistics Panel</h3>
      </div>

      <div className="stats-grid">
        {/* Основные метрики */}
        <div className="stat-card primary-card">
          <div className="stat-header">
            <h4>
              <img
                src={tomatoGif}
                alt="Tomato"
                className="ms-1"
                style={{ width: "30px", height: "30px" }}
              />{" "}
              Today
            </h4>
          </div>
          <div className="stat-content">
            <div className="stat-number">{dailyCount}</div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getGoalProgress()}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round(getGoalProgress())}% of goal
              </span>
            </div>
          </div>
        </div>

        {/* Total pomodoros counter */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>
              Total{" "}
              <img
                src={tomatoGif}
                alt="Tomato"
                className="ms-1"
                style={{ width: "30px", height: "30px" }}
              />
            </h4>
          </div>
          <div className="stat-content">
            <div className="stat-number">{databaseTotalCount}</div>
            <div className="stat-subtitle">total</div>
          </div>
        </div>

        {/* Efficiency */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>Efficiency</h4>
          </div>
          <div className="stat-content">
            <div
              className="stat-number"
              style={{ color: getEfficiencyColor(stats.efficiency) }}
            >
              {isNaN(stats.efficiency) ? 0 : stats.efficiency}%
            </div>
            <div className="stat-subtitle">weekly average</div>
          </div>
        </div>

        {/* Total time */}
        <div className="stat-card">
          <div className="stat-header">
            <h4>Total Time</h4>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalMinutes}</div>
            <div className="stat-subtitle">minutes this month</div>
          </div>
        </div>

        {/* Best day */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon"></span>
            <h4>Best Day</h4>
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.bestDay}</div>
            <div className="stat-subtitle">pomodoros per day</div>
          </div>
        </div>

        {/* Average daily */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon"></span>
            <h4>
              Average{" "}
              <img
                src={tomatoGif}
                alt="Tomato"
                className="ms-1"
                style={{ width: "30px", height: "30px" }}
              />{" "}
              Daily
            </h4>
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {isNaN(stats.averageDaily) ? 0 : stats.averageDaily}
            </div>
            <div className="stat-subtitle">last 7 days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
