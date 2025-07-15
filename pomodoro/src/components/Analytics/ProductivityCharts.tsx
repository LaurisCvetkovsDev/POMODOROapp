import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import {
  analyticsService,
  ProductivityTrend,
  DayActivity,
} from "../../services/analyticsApi";
import { format } from "date-fns";
import "./ProductivityCharts.css";
import tomatoGif from "../../assets/000102401.gif";

interface ProductivityChartsProps {
  userId: number;
}

const ProductivityCharts: React.FC<ProductivityChartsProps> = ({ userId }) => {
  const [trends, setTrends] = useState<ProductivityTrend[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendsData, dailyData] = await Promise.all([
          analyticsService.getProductivityTrends(userId, 30),
          analyticsService.getDailyActivity(userId, 30),
        ]);

        setTrends(trendsData);
        setDailyActivity(dailyData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM");
  };

  // Chart colors
  const colors = {
    pomodoros: "#39d353",
    sessions: "#26a641",
    workTime: "#58a6ff",
    breakTime: "#f85149",
    accent: "#b0e0e6",
    warning: "#f85149",
    info: "#58a6ff",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="tooltip-value"
              style={{ color: entry.color }}
            >
              {`${entry.name}: ${entry.value}${
                entry.name.includes("min") || entry.name.includes("duration")
                  ? " min"
                  : ""
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for completed pomodoros and sessions chart
  const completionData = dailyActivity.map((day) => ({
    date: day.date,
    completed_pomodoros: day.count,
    daily_sessions: day.count > 0 ? 1 : 0, // 1 if any activity, 0 if none
  }));

  // Prepare data for work/break duration chart
  const durationData = trends.map((trend) => ({
    date: trend.date,
    work_duration: Math.round(trend.focus_time),
    break_duration: Math.round(trend.break_time),
    total_time: Math.round(trend.focus_time + trend.break_time),
  }));

  if (loading) {
    return (
      <div className="charts-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
          Loading charts...
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container glass-item">
      <div className="charts-header">
        <h3>Productivity Analytics</h3>
      </div>

      <div className="chart-content">
        {/* Chart 1: Completed Pomodoros and Daily Sessions */}
        <div className="chart-section">
          <h4>
            Completed{" "}
            <img
              src={tomatoGif}
              alt="Tomato"
              className="ms-1"
              style={{ width: "30px", height: "30px" }}
            />{" "}
            & Daily Sessions (30 days)
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#ccc" />
              <YAxis yAxisId="left" stroke="#ccc" />
              <YAxis yAxisId="right" orientation="right" stroke="#ccc" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="completed_pomodoros"
                fill={colors.pomodoros}
                name="Completed Tomatoes"
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="daily_sessions"
                stroke={colors.sessions}
                strokeWidth={3}
                dot={{ fill: colors.sessions, r: 4 }}
                name="Daily Sessions"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Work and Break Duration */}
        <div className="chart-section">
          <h4>Work & Break Duration Over Time (30 days)</h4>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="work_duration"
                stackId="1"
                stroke={colors.workTime}
                fill={colors.workTime}
                fillOpacity={0.7}
                name="Work Duration (min)"
              />
              <Area
                type="monotone"
                dataKey="break_duration"
                stackId="1"
                stroke={colors.breakTime}
                fill={colors.breakTime}
                fillOpacity={0.7}
                name="Break Duration (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-insights">
        <div className="insight-card">
          <span className="insight-icon">
            <img
              src={tomatoGif}
              alt="Tomato"
              style={{ width: "24px", height: "24px" }}
            />
          </span>
          <div>
            <h5>
              Average Daily{" "}
              <img
                src={tomatoGif}
                alt="Tomato"
                className="ms-1"
                style={{ width: "20px", height: "20px" }}
              />
            </h5>
            <p>
              {completionData.length > 0 &&
                Math.round(
                  completionData.reduce(
                    (sum, d) => sum + d.completed_pomodoros,
                    0
                  ) / completionData.length
                )}
            </p>
          </div>
        </div>
        <div className="insight-card">
          <span className="insight-icon"></span>
          <div>
            <h5>Average Work Time</h5>
            <p>
              {durationData.length > 0 &&
                Math.round(
                  durationData.reduce((sum, d) => sum + d.work_duration, 0) /
                    durationData.length
                )}{" "}
              min
            </p>
          </div>
        </div>
        <div className="insight-card">
          <span className="insight-icon"></span>
          <div>
            <h5>Average Break Time</h5>
            <p>
              {durationData.length > 0 &&
                Math.round(
                  durationData.reduce((sum, d) => sum + d.break_duration, 0) /
                    durationData.length
                )}{" "}
              min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityCharts;
