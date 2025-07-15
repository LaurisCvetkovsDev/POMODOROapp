import React, { useState, useEffect } from "react";

const DailyResetIndicator: React.FC = () => {
  const [timeUntilReset, setTimeUntilReset] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();

      // Calculate next midnight (12 AM / 00:00)
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 1); // Tomorrow
      nextReset.setHours(0, 0, 0, 0); // Set to 00:00:00 AM (midnight)

      const timeDiff = nextReset.getTime() - now.getTime();

      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilReset("Now!");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        fontSize: "0.7rem",
        color: "#888",
        textAlign: "center",
        marginTop: "5px",
        opacity: 0.7,
      }}
    >
      Daily reset in: {timeUntilReset}
    </div>
  );
};

export default DailyResetIndicator;
