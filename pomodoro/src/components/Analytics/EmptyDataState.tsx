import React from "react";

interface EmptyDataStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

const EmptyDataState: React.FC<EmptyDataStateProps> = ({
  title = "No Data Available",
  message = "Start using Pomodoro timer to see your analytics here!",
  icon = "📊",
}) => {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "#8b949e",
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      <div
        style={{
          fontSize: "4rem",
          marginBottom: "20px",
          opacity: 0.5,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "1.2rem",
          marginBottom: "10px",
          color: "#c9d1d9",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.9rem",
          lineHeight: "1.5",
          maxWidth: "300px",
          margin: "0 auto",
        }}
      >
        {message}
      </p>
    </div>
  );
};

export default EmptyDataState;
