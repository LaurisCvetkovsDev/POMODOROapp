import React, { useState, useEffect } from "react";
import { analyticsService, DayActivity } from "../../services/analyticsApi";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import "./ActivityHeatmap.css";

interface ActivityHeatmapFallbackProps {
  userId: number;
}

const ActivityHeatmapFallback: React.FC<ActivityHeatmapFallbackProps> = ({
  userId,
}) => {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getDailyActivity(userId, 365);
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  const getColorClass = (count: number) => {
    if (count === 0) return "color-empty";
    if (count === 1) return "color-scale-1";
    if (count === 2) return "color-scale-2";
    if (count === 3) return "color-scale-3";
    if (count === 4) return "color-scale-4";
    if (count === 5) return "color-scale-5";
    if (count === 6) return "color-scale-6";
    if (count <= 8) return "color-scale-7";
    if (count <= 12) return "color-scale-8";
    return "color-scale-9";
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const selectedActivity = selectedDate
    ? activities.find((a) => a.date === selectedDate)
    : null;

  const generateCalendarGrid = () => {
    const today = new Date();
    const startDate = subDays(today, 364); // 365 days ago
    const weeks = [];

    let currentDate = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday

    for (let week = 0; week < 53; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const activity = activities.find((a) => a.date === dateStr);
        const count = activity?.count || 0;

        days.push({
          date: dateStr,
          count,
          isInRange: currentDate >= startDate && currentDate <= today,
        });

        currentDate = addDays(currentDate, 1);
      }
      weeks.push(days);
    }

    return weeks;
  };

  if (loading) {
    return (
      <div className="activity-heatmap-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
          Loading activity map...
        </div>
      </div>
    );
  }

  const weeks = generateCalendarGrid();
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="activity-heatmap-container glass-item">
      <div className="heatmap-header">
        <h3>Activity Map</h3>
        <p>Your productivity over the past year</p>
      </div>

      <div className="heatmap-wrapper">
        <div className="custom-heatmap">
          <div className="weekday-labels">
            {weekdayLabels.map((label, index) => (
              <div key={index} className="weekday-label">
                {label}
              </div>
            ))}
          </div>

          <div className="heatmap-grid">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`heatmap-day ${getColorClass(day.count)} ${
                      !day.isInRange ? "out-of-range" : ""
                    } ${selectedDate === day.date ? "selected" : ""}`}
                    onClick={() => day.isInRange && handleDayClick(day.date)}
                    title={
                      day.isInRange
                        ? `${format(new Date(day.date), "dd MMM yyyy")}: ${
                            day.count
                          } Pomodoros`
                        : ""
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-squares">
          <div className="legend-square color-empty"></div>
          <div className="legend-square color-scale-1"></div>
          <div className="legend-square color-scale-2"></div>
          <div className="legend-square color-scale-3"></div>
          <div className="legend-square color-scale-4"></div>
          <div className="legend-square color-scale-5"></div>
          <div className="legend-square color-scale-6"></div>
          <div className="legend-square color-scale-7"></div>
          <div className="legend-square color-scale-8"></div>
          <div className="legend-square color-scale-9"></div>
        </div>
        <span>More</span>
      </div>

      {selectedActivity && (
        <div className="selected-day-info">
          <h4>{format(new Date(selectedActivity.date), "dd MMMM yyyy")}</h4>
          <div className="day-stats">
            <div className="stat">
              <span className="stat-label">Pomodoros:</span>
              <span className="stat-value">{selectedActivity.count}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time:</span>
              <span className="stat-value">
                {Math.round(selectedActivity.total_duration)} min
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Completed:</span>
              <span className="stat-value">
                {Math.round(selectedActivity.completion_rate)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="heatmap-insights">
        <span className="insight-icon">📈</span>
        <span>
          Most productive:{" "}
          {activities.length > 0
            ? (() => {
                const best = activities.reduce(
                  (best, current) =>
                    current.count > best.count ? current : best,
                  activities[0]
                );
                return `${best.date} (${best.count} Pomodoros)`;
              })()
            : "No data"}
        </span>
      </div>
      <div className="heatmap-insights">
        <span className="insight-icon">🏆</span>
        <span>
          Average day:{" "}
          {activities.length > 0
            ? (
                activities.reduce((sum, a) => sum + a.count, 0) /
                activities.length
              ).toFixed(1)
            : 0}{" "}
          Pomodoros
        </span>
      </div>
      <div className="heatmap-insights">
        <span className="insight-icon">🔥</span>
        <span>Active days: {activities.filter((a) => a.count > 0).length}</span>
      </div>
    </div>
  );
};

export default ActivityHeatmapFallback;
