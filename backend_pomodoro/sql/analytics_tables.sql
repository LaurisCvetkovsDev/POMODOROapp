-- ===================================
-- АНАЛИТИЧЕСКИЕ ТАБЛИЦЫ ДЛЯ POMODORO
-- ===================================

-- 1. Таблица для ежедневной статистики пользователей
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    pomodoros_completed INT DEFAULT 0,
    total_work_minutes INT DEFAULT 0,
    total_break_minutes INT DEFAULT 0,
    sessions_started INT DEFAULT 0,
    sessions_completed INT DEFAULT 0,
    average_session_length DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_date (date)
);

-- 2. Улучшенная таблица сессий (если нужно расширить существующую)
CREATE TABLE IF NOT EXISTS pomodoro_sessions_extended (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_type ENUM('work', 'short_break', 'long_break') NOT NULL,
    planned_duration INT NOT NULL, -- в секундах
    actual_duration INT NOT NULL, -- в секундах
    is_completed BOOLEAN DEFAULT FALSE,
    interruption_count INT DEFAULT 0,
    focus_score DECIMAL(5,2) DEFAULT 100, -- от 0 до 100
    productivity_rating INT DEFAULT NULL, -- от 1 до 5, опционально
    tags JSON DEFAULT NULL, -- теги/категории работы
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, session_date),
    INDEX idx_session_type (session_type),
    INDEX idx_completed (is_completed)
);

-- 3. Таблица для почасовой статистики (для анализа продуктивности по времени дня)
CREATE TABLE IF NOT EXISTS hourly_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    hour TINYINT NOT NULL, -- 0-23
    pomodoros_count INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    avg_focus_score DECIMAL(5,2) DEFAULT 0,
    sessions_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date_hour (user_id, date, hour),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_hour (hour)
);

-- 4. Таблица для недельных сводок
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    week_start DATE NOT NULL, -- понедельник недели
    week_end DATE NOT NULL, -- воскресенье недели
    total_pomodoros INT DEFAULT 0,
    total_work_minutes INT DEFAULT 0,
    average_daily_pomodoros DECIMAL(5,2) DEFAULT 0,
    best_day_count INT DEFAULT 0,
    worst_day_count INT DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0, -- от 0 до 100
    weekly_goal INT DEFAULT 0,
    goal_achieved BOOLEAN DEFAULT FALSE,
    streak_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_week (user_id, week_start),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_week (user_id, week_start)
);

-- 5. Таблица для паттернов и инсайтов
CREATE TABLE IF NOT EXISTS productivity_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    best_time_start TIME DEFAULT NULL, -- лучшее время для работы
    best_time_end TIME DEFAULT NULL,
    worst_time_start TIME DEFAULT NULL, -- худшее время для работы
    worst_time_end TIME DEFAULT NULL,
    best_day_of_week TINYINT DEFAULT NULL, -- 1=понедельник, 7=воскресенье
    worst_day_of_week TINYINT DEFAULT NULL,
    average_session_length DECIMAL(5,2) DEFAULT 0,
    peak_productivity_hour TINYINT DEFAULT NULL,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_pattern (user_id, pattern_type),
    INDEX idx_analysis_date (analysis_date)
);

-- 6. Таблица для целей и достижений
CREATE TABLE IF NOT EXISTS user_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    target_value INT NOT NULL, -- целевое количество pomodoros
    current_value INT DEFAULT 0, -- текущий прогресс
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_achieved BOOLEAN DEFAULT FALSE,
    achievement_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goals (user_id, goal_type),
    INDEX idx_date_range (start_date, end_date)
);

-- ===================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ СТАТИСТИКИ
-- ===================================

-- Триггер для обновления daily_stats при добавлении новой сессии
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_daily_stats_after_session
AFTER INSERT ON pomodoro_sessions
FOR EACH ROW
BEGIN
    -- Обновляем или создаем запись в daily_stats
    INSERT INTO daily_stats (
        user_id, 
        date, 
        sessions_started, 
        sessions_completed,
        pomodoros_completed,
        total_work_minutes
    ) VALUES (
        NEW.user_id,
        DATE(NEW.start_time),
        1,
        IF(NEW.is_completed = 1, 1, 0),
        IF(NEW.is_completed = 1 AND NEW.duration >= 1500, 1, 0), -- минимум 25 минут
        FLOOR(NEW.duration / 60)
    ) ON DUPLICATE KEY UPDATE
        sessions_started = sessions_started + 1,
        sessions_completed = sessions_completed + IF(NEW.is_completed = 1, 1, 0),
        pomodoros_completed = pomodoros_completed + IF(NEW.is_completed = 1 AND NEW.duration >= 1500, 1, 0),
        total_work_minutes = total_work_minutes + FLOOR(NEW.duration / 60),
        completion_rate = (sessions_completed / sessions_started) * 100,
        updated_at = CURRENT_TIMESTAMP;
        
    -- Обновляем почасовую статистику
    INSERT INTO hourly_stats (
        user_id,
        date,
        hour,
        sessions_count,
        pomodoros_count,
        total_minutes
    ) VALUES (
        NEW.user_id,
        DATE(NEW.start_time),
        HOUR(NEW.start_time),
        1,
        IF(NEW.is_completed = 1 AND NEW.duration >= 1500, 1, 0),
        FLOOR(NEW.duration / 60)
    ) ON DUPLICATE KEY UPDATE
        sessions_count = sessions_count + 1,
        pomodoros_count = pomodoros_count + IF(NEW.is_completed = 1 AND NEW.duration >= 1500, 1, 0),
        total_minutes = total_minutes + FLOOR(NEW.duration / 60),
        updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ===================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ===================================

-- Дополнительные индексы для быстрых запросов аналитики
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_completed ON pomodoro_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_duration ON pomodoro_sessions(duration);

-- ===================================
-- ПРОЦЕДУРЫ ДЛЯ ГЕНЕРАЦИИ АНАЛИТИКИ
-- ===================================

-- Процедура для обновления недельных сводок
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS UpdateWeeklySummary(IN p_user_id INT, IN p_week_start DATE)
BEGIN
    DECLARE v_week_end DATE;
    DECLARE v_total_pomodoros INT DEFAULT 0;
    DECLARE v_total_minutes INT DEFAULT 0;
    DECLARE v_best_day INT DEFAULT 0;
    DECLARE v_worst_day INT DEFAULT 0;
    
    SET v_week_end = DATE_ADD(p_week_start, INTERVAL 6 DAY);
    
    -- Считаем статистику за неделю
    SELECT 
        COALESCE(SUM(pomodoros_completed), 0),
        COALESCE(SUM(total_work_minutes), 0),
        COALESCE(MAX(pomodoros_completed), 0),
        COALESCE(MIN(pomodoros_completed), 0)
    INTO v_total_pomodoros, v_total_minutes, v_best_day, v_worst_day
    FROM daily_stats
    WHERE user_id = p_user_id 
    AND date BETWEEN p_week_start AND v_week_end;
    
    -- Обновляем или создаем недельную сводку
    INSERT INTO weekly_summaries (
        user_id,
        week_start,
        week_end,
        total_pomodoros,
        total_work_minutes,
        average_daily_pomodoros,
        best_day_count,
        worst_day_count
    ) VALUES (
        p_user_id,
        p_week_start,
        v_week_end,
        v_total_pomodoros,
        v_total_minutes,
        v_total_pomodoros / 7.0,
        v_best_day,
        v_worst_day
    ) ON DUPLICATE KEY UPDATE
        total_pomodoros = v_total_pomodoros,
        total_work_minutes = v_total_minutes,
        average_daily_pomodoros = v_total_pomodoros / 7.0,
        best_day_count = v_best_day,
        worst_day_count = v_worst_day,
        updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ===================================
-- НАЧАЛЬНАЯ МИГРАЦИЯ ДАННЫХ
-- ===================================

-- Процедура для миграции существующих данных в новые таблицы
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS MigrateExistingData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id INT;
    DECLARE v_date DATE;
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT user_id, DATE(start_time) as session_date 
        FROM pomodoro_sessions 
        ORDER BY user_id, session_date;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_user_id, v_date;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Создаем записи в daily_stats для существующих данных
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
            SUM(CASE WHEN is_completed = 1 AND duration >= 1500 THEN 1 ELSE 0 END) as pomodoros_completed,
            SUM(FLOOR(duration / 60)) as total_work_minutes,
            (SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as completion_rate
        FROM pomodoro_sessions
        WHERE user_id = v_user_id AND DATE(start_time) = v_date
        GROUP BY user_id, DATE(start_time);
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- Комментарий: Запустите процедуру миграции после создания таблиц
-- CALL MigrateExistingData(); 