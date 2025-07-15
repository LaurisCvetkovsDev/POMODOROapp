import React, { useState, useEffect } from "react";
import { usePomodoroStore } from "../store/pomodoroStore";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const {
    workDuration,
    setWorkDuration,
    shortBreakDuration,
    setShortBreakDuration,
    selectedSound,
    setSelectedSound,
  } = usePomodoroStore();

  const [workTime, setWorkTime] = useState(workDuration);
  const [shortBreak, setShortBreak] = useState(shortBreakDuration);
  const [sound, setSound] = useState(selectedSound);

  // Available sound options
  const soundOptions = [
    { value: "POMODOROdone2-1.mp3", label: "Classic bell" },
  ];

  // Update local state when store values change
  useEffect(() => {
    setWorkTime(workDuration);
    setShortBreak(shortBreakDuration);
    setSound(selectedSound);
  }, [workDuration, shortBreakDuration, selectedSound]);

  const handleSave = () => {
    setWorkDuration(workTime);
    setShortBreakDuration(shortBreak);
    setSelectedSound(sound);
    onClose();
  };

  const playPreview = (soundFile: string) => {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Не удалось воспроизвести звук:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Timer Settings</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-item">
            <label>Work duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={workTime}
              onChange={(e) => setWorkTime(Number(e.target.value))}
              className="form-control"
            />
          </div>
          <div className="setting-item">
            <label>Break duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={shortBreak}
              onChange={(e) => setShortBreak(Number(e.target.value))}
              className="form-control"
            />
          </div>
        </div>
        <div className="settings-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
