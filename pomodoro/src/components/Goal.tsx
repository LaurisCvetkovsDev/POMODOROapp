import React, { useRef, useState, useEffect } from "react";
import { usePomodoroStore } from "../store/pomodoroStore";
import { useAuth } from "../contexts/AuthContext";
import { userStatsService } from "../services/api";
import GoalSettings from "./GoalSettings";
import DailyResetIndicator from "./DailyResetIndicator";
import tomatoGif from "../assets/000102401.gif";
import goalDoneSound from "../assets/sounds/GOALdone2.mp3";

function Goal() {
  const { dailyGoal, goalReachedToday, setGoalReachedToday, isCompleted } =
    usePomodoroStore();
  const { user } = useAuth();
  const GOALdone = useRef(new Audio(goalDoneSound));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // State for database data
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Function to fetch today's data from database
  const fetchTodayData = async () => {
    if (!user) {
      setDailyCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await userStatsService.getUserCounts(
        parseInt(user.id.toString())
      );
      setDailyCount(data.daily_pomodoros);
    } catch (error) {
      console.error("Failed to fetch today data:", error);
      setDailyCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when user changes
  useEffect(() => {
    fetchTodayData();
  }, [user]);

  // Refetch data when a pomodoro is completed
  useEffect(() => {
    if (isCompleted && user) {
      // Wait a bit for the session to be saved to database
      setTimeout(() => {
        fetchTodayData();
      }, 1000);
    }
  }, [isCompleted, user]);

  // Check if goal is reached and play sound only once per day
  useEffect(() => {
    if (dailyCount >= dailyGoal && !goalReachedToday && dailyGoal > 0) {
      GOALdone.current.play().catch(() => {
        console.log("Could not play goal completion sound");
      });
      setGoalReachedToday(true);
    }
  }, [dailyCount, dailyGoal, goalReachedToday, setGoalReachedToday]);

  // Calculate progress percentage
  const progressPercentage =
    dailyGoal > 0 ? Math.min((dailyCount / dailyGoal) * 100, 100) : 0;
  const isGoalReached = dailyCount >= dailyGoal && dailyGoal > 0;

  // Circle progress calculations
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * progressPercentage) / 100;

  if (loading) {
    return (
      <div className="goal-container">
        <div className="goal-card">
          <div className="goal-header">
            <h3>Daily Goal</h3>
          </div>
          <div className="goal-content">
            <div
              style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}
            >
              Loading data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="goal-header">
        <h3>Daily Goal</h3>
        <button
          className="goal-settings-btn"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Goal settings"
        >
          ⚙️
        </button>
      </div>

      {/* Main content */}
      <div className="goal-content">
        {/* Circular progress */}
        <div className="progress-circle-container">
          <svg className="progress-circle" width="280" height="280">
            <circle
              className="progress-circle-bg"
              cx="140"
              cy="140"
              r={radius}
              strokeWidth="10"
              fill="none"
            />
            <circle
              className="progress-circle-fill"
              cx="140"
              cy="140"
              r={radius}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 140 140)"
            />
          </svg>

          {/* Numbers in center */}
          <div className="goal-numbers">
            <span className="current">{dailyCount}</span>
            <span className="separator"> / </span>
            <span className="target">
              {dailyGoal}
              <img
                src={tomatoGif}
                alt="Tomato"
                className="ms-1"
                style={{ width: "60px", height: "60px" }}
              />
            </span>
          </div>
        </div>

        {/* Status */}
        {isGoalReached ? (
          <div className="status completed">✓ Goal reached</div>
        ) : (
          <div className="status">{Math.round(progressPercentage)}%</div>
        )}
      </div>

      {/* Footer */}
      <DailyResetIndicator />

      <GoalSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <style>{`
        .goal-container {
          width: 100%;
          height: auto;
          min-height: 80vh;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .goal-card {
          width: 100%;
          max-width: 600px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          color: wheat;
          display: flex;
          flex-direction: column;
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .goal-header h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: 500;
          color: wheat;
          opacity: 0.9;
        }

        .goal-settings-btn {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          color: wheat;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .goal-settings-btn:hover {
          opacity: 1;
        }

        .goal-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .progress-circle-container {
          position: relative;
          display: inline-block;
          margin-bottom: 30px;
        }

        .progress-circle {
          transform: rotate(0deg);
        }

        .progress-circle-bg {
          stroke: rgba(245, 222, 179, 0.1);
        }

        .progress-circle-fill {
          stroke: wheat;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }

        .goal-numbers {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3.5rem;
          font-weight: 300;
          line-height: 1;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .current {
          color: wheat;
        }

        .separator {
          color: rgba(245, 222, 179, 0.5);
          margin: 0 8px;
        }

        .target {
          color: rgba(245, 222, 179, 0.7);
        }

        .status {
          font-size: 1.5rem;
          color: rgba(245, 222, 179, 0.7);
          font-weight: 400;
        }

        .status.completed {
          color: wheat;
        }
      `}</style>
    </>
  );
}

export default Goal;
