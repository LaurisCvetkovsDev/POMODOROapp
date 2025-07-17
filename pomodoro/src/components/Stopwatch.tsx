import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePomodoroStore } from "../store/pomodoroStore";
import Settings from "./Settings";
import { useAuth } from "../contexts/AuthContext";
import { pomodoroSessionService } from "../services/api";
import pomodoroCompleteSound from "../assets/sounds/POMODOROdone2-1.mp3";
import restCompleteSound from "../assets/sounds/RESTdone.mp3";
import { ElectronAPI, TimerUpdate } from "../types";

function CountdownTimer() {
  // Pārbaudām vai ir kompaktais režīms
  const isCompactMode =
    new URLSearchParams(window.location.search).get("compact") === "true";

  // Stāvokļa mainīgie
  const [isRunning, setIsRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMainTimerVisible, setIsMainTimerVisible] = useState(true);

  // Veikala stāvokļa mainīgie
  const {
    workDuration,
    shortBreakDuration,
    isWorkPhase,
    togglePhase,
    incrementCount,
    setCompleted,
    completedMinutes,
    startSession,
    endSession,
    currentSession,
    checkAndResetDaily,
    selectedSound,
  } = usePomodoroStore();

  // Atsauces
  const audioRef = useRef(new Audio(pomodoroCompleteSound));
  const breakEndAudioRef = useRef(new Audio(restCompleteSound));
  const lastSyncRef = useRef(0);
  const { user } = useAuth();

  // Initialization and settings
  useEffect(() => {
    // Set initial display time
    if (displayTime === 0 && !isCompactMode) {
      const duration = isWorkPhase ? workDuration : shortBreakDuration;
      setDisplayTime(duration * 60 * 1000);
    }

    // Update sound
    audioRef.current = new Audio(pomodoroCompleteSound);
    // Break end sound remains unchanged
    breakEndAudioRef.current = new Audio(restCompleteSound);

    // Update body class
    document.body.classList.toggle("timer-minimized", !isMainTimerVisible);

    // Send settings to Electron
    if (window.electronAPI?.updateTimerSettings && !isCompactMode) {
      window.electronAPI.updateTimerSettings(workDuration, shortBreakDuration);
    }

    return () => document.body.classList.remove("timer-minimized");
  }, [
    workDuration,
    shortBreakDuration,
    isWorkPhase,
    isMainTimerVisible,
    displayTime,
    isCompactMode,
    selectedSound,
  ]);

  // Update display time when phase or duration changes
  useEffect(() => {
    if (!isCompactMode) {
      const duration = isWorkPhase ? workDuration : shortBreakDuration;
      setDisplayTime(duration * 60 * 1000);
    }
  }, [isWorkPhase, workDuration, shortBreakDuration, isCompactMode]);

  // Session data sending to server
  const sendSessionToServer = useCallback(
    async (session: any) => {
      if (!user || session.type !== "work" || session.actualMinutesWorked === 0)
        return;

      try {
        const startTime = new Date(session.startTime);
        const endTime = new Date(
          startTime.getTime() + session.actualMinutesWorked * 60 * 1000
        );

        await pomodoroSessionService.createSession({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: session.actualMinutesWorked * 60,
          is_completed: session.isCompleted,
        });
      } catch (error) {
        console.error("Failed to save pomodoro session:", error);
      }
    },
    [user]
  );

  // Timer completion handling
  const handleTimerEnd = useCallback(
    async (timeLeft: number, isManualStop = false) => {
      const totalDuration = isWorkPhase ? workDuration : shortBreakDuration;
      const workedSeconds = Math.max(0, totalDuration * 60 - timeLeft);
      const actualMinutesWorked = workedSeconds / 60; // Keep as decimal for testing
      const isCompleted = !isManualStop && timeLeft === 0;

      // End session if it exists
      if (currentSession) {
        const completedSession = endSession(actualMinutesWorked, isCompleted);
        console.log("DEBUG: Session ended:", {
          isWorkPhase,
          actualMinutesWorked,
          isCompleted,
        });

        // Count work sessions regardless of current phase
        if (completedSession.type === "work" && actualMinutesWorked > 0) {
          console.log(
            "DEBUG: Adding work session:",
            actualMinutesWorked,
            "minutes, Session type:",
            completedSession.type
          );
          // Check for daily reset before incrementing
          checkAndResetDaily();
          incrementCount(actualMinutesWorked);
          await sendSessionToServer(completedSession);
        } else {
          console.log("DEBUG: Not a work session or no time worked:", {
            sessionType: completedSession.type,
            actualMinutesWorked,
            isWorkPhase,
          });
        }
      } else {
        console.log("DEBUG: No current session to end");
      }

      // Show completion indicator
      if (isCompleted && isWorkPhase) {
        setCompleted(true);
        setTimeout(() => setCompleted(false), 1000);
        try {
          audioRef.current.play().catch(() => {});
        } catch {}
      }

      // Phase transition
      if (isCompleted) {
        togglePhase();
        if (isWorkPhase) {
          // Start break
          setTimeout(() => {
            startSession("break");
            if (window.electronAPI?.startTimer) {
              window.electronAPI.sendTimerUpdate?.(
                shortBreakDuration * 60,
                true
              );
              window.electronAPI.startTimer();
              setIsRunning(true);
            }
          }, 100);
        } else {
          // Return to work - play break end sound
          try {
            breakEndAudioRef.current.play().catch(() => {
              console.log("Could not play break end sound");
            });
          } catch {}

          setIsRunning(false);
          if (window.electronAPI?.sendTimerUpdate) {
            window.electronAPI.sendTimerUpdate(workDuration * 60, false);
          }
        }
      } else {
        // Manual stop
        setIsRunning(false);
        const currentDuration = isWorkPhase ? workDuration : shortBreakDuration;
        setDisplayTime(currentDuration * 60 * 1000);
        if (window.electronAPI?.sendTimerUpdate) {
          window.electronAPI.sendTimerUpdate(currentDuration * 60, false);
        }
      }
    },
    [
      isWorkPhase,
      workDuration,
      shortBreakDuration,
      currentSession,
      endSession,
      incrementCount,
      sendSessionToServer,
      setCompleted,
      togglePhase,
      startSession,
    ]
  );

  // Electron synchronization
  useEffect(() => {
    if (!window.electronAPI?.onTimerSync) return;

    const handleTimerSync = (update: TimerUpdate) => {
      const now = Date.now();
      if (now - lastSyncRef.current < 300) return; // Throttle
      lastSyncRef.current = now;

      setDisplayTime(update.timeLeft * 1000);
      setIsRunning(update.isRunning);

      // Synchronize phase
      const store = usePomodoroStore.getState();
      if (store.isWorkPhase !== update.isWorkPhase) {
        store.togglePhase();
      }

      // Handle completion
      if (update.timeLeft === 0) {
        if (currentSession) {
          handleTimerEnd(0, false);
        } else if (update.isWorkPhase) {
          // Fallback logic for component reload - work session
          const store = usePomodoroStore.getState();
          incrementCount(store.workDuration);
          sendSessionToServer({
            startTime: new Date(Date.now() - store.workDuration * 60 * 1000),
            actualMinutesWorked: store.workDuration,
            isCompleted: true,
            type: "work",
          });
          setCompleted(true);
          setTimeout(() => setCompleted(false), 1000);
          try {
            audioRef.current.play().catch(() => {});
          } catch {}
          togglePhase();
        } else {
          // Fallback logic for break end
          try {
            breakEndAudioRef.current.play().catch(() => {
              console.log("Could not play break end sound");
            });
          } catch {}
          togglePhase();
        }
      }
    };

    window.electronAPI.onTimerSync(handleTimerSync);
    window.electronAPI.onRestore?.(() => setIsMainTimerVisible(true));

    return () => {
      window.electronAPI?.removeAllListeners?.("timer-sync");
    };
  }, [
    currentSession,
    handleTimerEnd,
    incrementCount,
    sendSessionToServer,
    setCompleted,
    togglePhase,
  ]);

  // Control functions
  const start = useCallback(() => {
    if (!window.electronAPI) return;

    if (isRunning) {
      window.electronAPI.pauseTimer();
    } else {
      if (!currentSession) {
        startSession(isWorkPhase ? "work" : "break");
      }
      const timeInSeconds = Math.floor(displayTime / 1000);
      window.electronAPI.sendTimerUpdate(timeInSeconds, true);
      window.electronAPI.startTimer();
      setIsRunning(true);
    }
  }, [isRunning, currentSession, startSession, isWorkPhase, displayTime]);

  const reset = useCallback(() => {
    if (!window.electronAPI) return;

    if (currentSession) {
      const timeInSeconds = Math.floor(displayTime / 1000);
      handleTimerEnd(timeInSeconds, true);
    }

    const duration = isWorkPhase ? workDuration : shortBreakDuration;
    setDisplayTime(duration * 60 * 1000);
    setIsRunning(false);
    window.electronAPI.sendTimerUpdate(duration * 60, false);
    window.electronAPI.resetTimer();
  }, [
    currentSession,
    displayTime,
    handleTimerEnd,
    isWorkPhase,
    workDuration,
    shortBreakDuration,
  ]);

  // Helper functions
  const formatTime = (timeInMs: number) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const getPhaseColor = () => (isWorkPhase ? "#ff6b6b" : "#4a90e2");
  const getPhaseText = () => (isWorkPhase ? "Work time" : "Break");

  if (!isMainTimerVisible && !isCompactMode) return null;

  return (
    <>
      <div className={`stopWatch ${isCompactMode ? "compact-mode" : ""}`}>
        <div
          className="phase-indicator"
          style={{
            color: getPhaseColor(),
            marginBottom: "10px",
            fontSize: isCompactMode ? "0.9rem" : "1.2rem",
          }}
        >
          {getPhaseText()}
        </div>

        <div
          className="display"
          style={{ fontSize: isCompactMode ? "1.8rem" : "5rem" }}
        >
          {formatTime(displayTime)}
        </div>

        {isWorkPhase && completedMinutes > 0 && !isCompactMode && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#888",
              marginTop: "5px",
              textAlign: "center",
            }}
          >
            {Math.round(completedMinutes * 10) / 10}/25 minutes until next
            pomodoro
          </div>
        )}

        <div className="controls">
          <button onClick={start} className="start-button btn btn-primary">
            {isRunning ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="6" y="4" width="3" height="12" fill="#111" />
                <rect x="11" y="4" width="3" height="12" fill="#111" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4L16 10L7 16V4Z" fill="#111" />
              </svg>
            )}
          </button>

          <button onClick={reset} className="reset-button btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 4a6 6 0 1 1-4.24 1.76"
                stroke="#111"
                strokeWidth="2"
                fill="none"
              />
              <polygon points="4,4 8,4 8,8" fill="#111" />
            </svg>
          </button>

          {isCompactMode ? (
            <button
              className="btn btn-outline-light compact-restore-btn"
              onClick={() => window.electronAPI?.restoreTimer()}
              title="Restore full view"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="14"
                  height="14"
                  rx="2"
                  stroke="#111"
                  strokeWidth="2"
                  fill="none"
                />
                <rect x="7" y="7" width="6" height="6" fill="#111" />
              </svg>
            </button>
          ) : (
            <button
              className="btn btn-outline-light"
              onClick={() => window.electronAPI?.minimizeTimer()}
              title="Minimize timer"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="15" width="10" height="2" rx="1" fill="#111" />
              </svg>
            </button>
          )}
        </div>

        {!isCompactMode && (
          <div className="settings-button-container">
            <button
              className="settings-button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Timer settings"
            >
              ⚙️
            </button>
          </div>
        )}
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default CountdownTimer;
