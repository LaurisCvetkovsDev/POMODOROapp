import React, { useState, useEffect } from "react";
import "./UpdateNotification.css";

interface UpdateInfo {
  version: string;
  isDev: boolean;
}

const UpdateNotification: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    // Получаем информацию о приложении
    const getAppInfo = async () => {
      try {
        if (window.electronAPI?.getUpdateInfo) {
          const info = await window.electronAPI.getUpdateInfo();
          setUpdateInfo(info);
        }
      } catch (error) {
        console.error("Ошибка при получении информации о приложении:", error);
      }
    };

    getAppInfo();

    // Слушаем статус обновлений
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((status: string) => {
        setUpdateStatus(status);
        setShowNotification(true);

        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      });
    }

    // Автоматически проверяем обновления при загрузке
    setTimeout(() => {
      checkForUpdates();
    }, 5000);
  }, []);

  const checkForUpdates = () => {
    if (window.electronAPI?.checkForUpdates) {
      setIsChecking(true);
      window.electronAPI.checkForUpdates();

      setTimeout(() => {
        setIsChecking(false);
      }, 3000);
    }
  };

  const downloadUpdate = () => {
    if (window.electronAPI?.downloadUpdate) {
      window.electronAPI.downloadUpdate();
    }
  };

  const installUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  if (!showNotification && !isChecking) {
    return null;
  }

  return (
    <div className={`update-notification ${showNotification ? "show" : ""}`}>
      <div className="update-content">
        <div className="update-header">
          <span className="update-icon">🔄</span>
          <span className="update-title">Обновления</span>
          <button
            className="update-close"
            onClick={() => setShowNotification(false)}
          >
            ×
          </button>
        </div>

        <div className="update-body">
          {isChecking ? (
            <div className="update-checking">
              <div className="spinner"></div>
              <span>Проверка обновлений...</span>
            </div>
          ) : (
            <>
              <p className="update-status">{updateStatus}</p>
              {updateInfo && (
                <p className="current-version">
                  Текущая версия: {updateInfo.version}
                </p>
              )}

              <div className="update-actions">
                <button
                  className="update-btn primary"
                  onClick={checkForUpdates}
                >
                  Проверить обновления
                </button>

                {updateStatus.includes("Доступно обновление") && (
                  <button
                    className="update-btn secondary"
                    onClick={downloadUpdate}
                  >
                    Скачать
                  </button>
                )}

                {updateStatus.includes("Обновление загружено") && (
                  <button
                    className="update-btn install"
                    onClick={installUpdate}
                  >
                    Установить
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
