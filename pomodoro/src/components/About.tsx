import React from "react";

const About: React.FC = () => {
  return (
    <div className="about-container">
      <h2>About Pomodoro Timer</h2>
      <div className="about-content">
        <p>
          The Pomodoro Technique is a time management method developed by
          Francesco Cirillo in the late 1980s. It uses a timer to break work
          into intervals, traditionally 25 minutes in length, separated by short
          breaks.
        </p>
        <h3>How to use this app</h3>
        <ol>
          <li>Set your work duration (default is 25 minutes)</li>
          <li>Set your break duration (default is 5 minutes)</li>
          <li>Click "Start" to begin your work session</li>
          <li>When the timer ends, take a break</li>
          <li>Repeat the process to maintain productivity</li>
        </ol>
        <h3>Features</h3>
        <ul>
          <li>Customizable work and break durations</li>
          <li>Track your daily and total completed pomodoros</li>
          <li>Connect with friends and share your progress</li>
          <li>View your productivity statistics</li>
        </ul>

        <div
          className="legal-links"
          style={{
            marginTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: "20px",
          }}
        >
          <p style={{ color: "rgba(245, 222, 179, 0.7)", fontSize: "0.9rem" }}>
            <a
              href="#/terms"
              style={{ color: "wheat", textDecoration: "underline" }}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "/terms";
              }}
            >
              Terms of Service / Пользовательское соглашение
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
