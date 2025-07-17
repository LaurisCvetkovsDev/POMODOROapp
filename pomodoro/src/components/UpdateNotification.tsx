import React, { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [appVersion, setAppVersion] = useState<string>('Веб-версия');
  const [isElectron, setIsElectron] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Проверяем, работаем ли мы в Electron
    const checkElectron = () => {
      const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI;
      setIsElectron(hasElectronAPI);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('UpdateNotification: Electron API доступен?', hasElectronAPI);
      }
    };

    checkElectron();

    if (window.electronAPI) {
      // Получаем версию приложения
      window.electronAPI.getAppVersion().then((version: string) => {
        setAppVersion(version);
        if (process.env.NODE_ENV === 'development') {
          console.log('UpdateNotification: Версия приложения:', version);
        }
      }).catch((error) => {
        console.warn('Не удалось получить версию приложения:', error);
        setAppVersion('Неизвестно');
      });

      // Слушаем события обновлений
      const handleUpdateAvailable = (event: any, info: UpdateInfo) => {
        console.log('UpdateNotification: Доступно обновление:', info);
        setUpdateAvailable(info);
        setIsChecking(false);
      };

      const handleDownloadProgress = (event: any, progress: DownloadProgress) => {
        console.log('UpdateNotification: Прогресс загрузки:', progress.percent + '%');
        setDownloadProgress(progress);
      };

      const handleUpdateDownloaded = (event: any, info: UpdateInfo) => {
        console.log('UpdateNotification: Обновление скачано:', info);
        setUpdateDownloaded(info);
        setDownloadProgress(null);
      };

      window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
      window.electronAPI.onDownloadProgress(handleDownloadProgress);
      window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);

      // Очистка слушателей при размонтировании
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('update-available');
          window.electronAPI.removeAllListeners('download-progress');
          window.electronAPI.removeAllListeners('update-downloaded');
        }
      };
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API недоступен - проверка обновлений невозможна');
      return;
    }

    setIsChecking(true);
    
    try {
      console.log('UpdateNotification: Проверка обновлений...');
      await window.electronAPI.checkForUpdates();
      
      // Если через 5 секунд не получили ответ, сбрасываем состояние
      setTimeout(() => {
        setIsChecking(false);
      }, 5000);
      
    } catch (error) {
      console.error('Ошибка при проверке обновлений:', error);
      setIsChecking(false);
    }
  };

  // Не показывать компонент если это не Electron
  if (!isElectron) {
    return null;
  }

  return (
    <div className="update-notification">
      {/* Информация о текущей версии */}
      <div className="version-info">
        <small className="text-muted">Версия: {appVersion}</small>
        <button 
          className={`btn btn-link btn-sm p-0 ms-2 ${isChecking ? 'disabled' : ''}`}
          onClick={handleCheckForUpdates}
          disabled={isChecking}
          title={isChecking ? "Проверка..." : "Проверить обновления"}
        >
          {isChecking ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Уведомление о доступном обновлении */}
      {updateAvailable && !updateDownloaded && (
        <div className="alert alert-info alert-dismissible fade show mt-2" role="alert">
          <strong>📦 Доступно обновление!</strong>
          <br />
          Новая версия {updateAvailable.version} скачивается...
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setUpdateAvailable(null)}
            aria-label="Закрыть"
          ></button>
        </div>
      )}

      {/* Прогресс загрузки */}
      {downloadProgress && (
        <div className="download-progress mt-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small>Загрузка обновления...</small>
            <small>{Math.round(downloadProgress.percent)}%</small>
          </div>
          <div className="progress">
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: `${downloadProgress.percent}%` }}
              aria-valuenow={downloadProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <small className="text-muted">
            {(downloadProgress.transferred / (1024 * 1024)).toFixed(1)} MB / {(downloadProgress.total / (1024 * 1024)).toFixed(1)} MB
            ({(downloadProgress.bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s)
          </small>
        </div>
      )}

      {/* Уведомление о скачанном обновлении */}
      {updateDownloaded && (
        <div className="alert alert-success alert-dismissible fade show mt-2" role="alert">
          <strong>✅ Обновление готово!</strong>
          <br />
          Версия {updateDownloaded.version} скачана и будет установлена при следующем запуске приложения.
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setUpdateDownloaded(null)}
            aria-label="Закрыть"
          ></button>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification; 