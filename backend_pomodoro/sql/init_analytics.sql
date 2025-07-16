-- Создание аналитических таблиц для ultraPOMODORO365p
-- Выполните этот файл в вашей базе данных

-- 1. Таблица ежедневной статистики
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    pomodoros_completed INT DEFAULT 0,
    total_work_minutes INT DEFAULT 0,
    sessions_started INT DEFAULT 0,
    sessions_completed INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date)
);

-- 2. Почасовая статистика
CREATE TABLE IF NOT EXISTS hourly_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    hour TINYINT NOT NULL,
    pomodoros_count INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    sessions_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date_hour (user_id, date, hour),
    INDEX idx_user_date (user_id, date)
);

-- 3. Процедура для заполнения статистики из существующих данных
DELIMITER $$

CREATE PROCEDURE PopulateAnalyticsData()
BEGIN
    -- Заполняем daily_stats
    INSERT IGNORE INTO daily_stats (
        user_id,
        date,
        sessions_started,
        sessions_completed,
        pomodoros_completed,
        total_work_minutes,
        completion_rate
    )
    SELECT 
        user_id,
        DATE(start_time) as date,
        COUNT(*) as sessions_started,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as sessions_completed,
        SUM(CASE WHEN is_completed = 1 AND duration >= 6 THEN 1 ELSE 0 END) as pomodoros_completed, -- Testing: 0.1 min = 6 seconds
        SUM(duration) / 60 as total_work_minutes,
        (SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as completion_rate
    FROM pomodoro_sessions
    GROUP BY user_id, DATE(start_time);
    
    -- Заполняем hourly_stats
    INSERT IGNORE INTO hourly_stats (
        user_id,
        date,
        hour,
        sessions_count,
        pomodoros_count,
        total_minutes
    )
    SELECT 
        user_id,
        DATE(start_time) as date,
        HOUR(start_time) as hour,
        COUNT(*) as sessions_count,
        SUM(CASE WHEN is_completed = 1 AND duration >= 6 THEN 1 ELSE 0 END) as pomodoros_count, -- Testing: 0.1 min = 6 seconds
        SUM(duration) / 60 as total_minutes
    FROM pomodoro_sessions
    GROUP BY user_id, DATE(start_time), HOUR(start_time);
    
    SELECT 'Данные аналитики успешно заполнены!' as message;
END$$

DELIMITER ;

-- Выполните эту процедуру после создания таблиц:
-- CALL PopulateAnalyticsData();
-- DROP PROCEDURE PopulateAnalyticsData; -- опционально удалить после использования 