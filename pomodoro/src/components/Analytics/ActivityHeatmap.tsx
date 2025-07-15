import React, { useState, useEffect } from "react";
import CalendarHeatmap, {
  ReactCalendarHeatmapValue,
} from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import "./ActivityHeatmap.css";
import { analyticsService, DayActivity } from "../../services/analyticsApi";
import { format, subDays } from "date-fns";
import EmptyDataState from "./EmptyDataState";
import tomatoGif from "../../assets/000102401.gif";

interface ActivityHeatmapProps {
  userId: number;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ userId }) => {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Get data directly from database only
        const data = await analyticsService.getDailyActivity(userId, 365);

        console.log("ActivityHeatmap: Using only database data:", {
          totalActivities: data.length,
        });

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

  const getColor = (value: number) => {
    if (value === 0) return "#ebedf0";
    if (value <= 2) return "#9be9a8";
    if (value <= 4) return "#40c463";
    if (value <= 6) return "#30a14e";
    return "#216e39";
  };

  const handleClick = (value: ReactCalendarHeatmapValue | null) => {
    if (value && value.date) {
      const dateStr =
        typeof value.date === "string"
          ? value.date
          : format(value.date, "yyyy-MM-dd");
      setSelectedDate(dateStr);
    }
  };

  const selectedActivity = selectedDate
    ? activities.find((a) => a.date === selectedDate)
    : null;

  if (loading) {
    return (
      <div className="activity-heatmap">
        <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
          Loading activity map...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-heatmap-container glass-item">
        <EmptyDataState
          title="No Activity Data"
          message="Complete some Pomodoro sessions to see your activity heat map!"
          icon="🔥"
        />
      </div>
    );
  }

  return (
    <div className="activity-heatmap-container glass-item">
      <div className="heatmap-header">
        <h3>Activity Map</h3>
        <p>Your productivity over the past year</p>
      </div>

      <div className="heatmap-wrapper">
        <CalendarHeatmap
          startDate={subDays(new Date(), 365)}
          endDate={new Date()}
          values={activities}
          classForValue={(value: ReactCalendarHeatmapValue | null) => {
            if (!value || (value.count ?? 0) === 0) return "color-empty";
            if ((value.count ?? 0) <= 2) return "color-scale-1";
            if ((value.count ?? 0) <= 4) return "color-scale-2";
            if ((value.count ?? 0) <= 6) return "color-scale-3";
            return "color-scale-4";
          }}
          tooltipDataAttrs={(value: ReactCalendarHeatmapValue | null) => ({
            "data-tip": value?.date
              ? `${format(new Date(value.date), "dd MMM yyyy")}: ${
                  value.count || 0
                } Pomodoros`
              : "No data",
          })}
          onClick={handleClick}
          showWeekdayLabels={true}
          weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
          monthLabels={[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ]}
        />
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-squares">
          <div className="legend-square color-empty"></div>
          <div className="legend-square color-scale-1"></div>
          <div className="legend-square color-scale-2"></div>
          <div className="legend-square color-scale-3"></div>
          <div className="legend-square color-scale-4"></div>
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
        <div className="insight">
          <span className="insight-icon"></span>
          <span>
            Best day:{" "}
            {activities.length > 0
              ? activities.reduce(
                  (best, current) =>
                    current.count > best.count ? current : best,
                  activities[0]
                ).count
              : 0}{" "}
            <img
              src={tomatoGif}
              alt="Tomato"
              className="ms-1"
              style={{ width: "30px", height: "30px" }}
            />
          </span>
        </div>
        <div className="insight">
          <span className="insight-icon"></span>
          <span>
            Average day:{" "}
            {activities.length > 0
              ? (
                  activities.reduce((sum, a) => sum + a.count, 0) /
                  activities.length
                ).toFixed(1)
              : 0}{" "}
            <img
              src={tomatoGif}
              alt="Tomato"
              className="ms-1"
              style={{ width: "30px", height: "30px" }}
            />
          </span>
        </div>
        <div className="insight">
          <span className="insight-icon"></span>
          <span>
            Active days: {activities.filter((a) => a.count > 0).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
