<?php
require_once 'config/database.php';

echo "<h2>Создание триггеров для автоматического обновления аналитики</h2>\n";

try {
    $database = new Database();
    $pdo = $database->getConnection();

    if (!$pdo) {
        throw new Exception("Не удалось подключиться к базе данных");
    }

    echo "<p>✅ Подключение к базе данных установлено</p>\n";

    // Удаляем триггер если существует
    $drop_trigger_sql = "DROP TRIGGER IF EXISTS update_analytics_after_session";
    $pdo->exec($drop_trigger_sql);
    echo "<p>🗑️ Старый триггер удален</p>\n";

    // Создаем новый триггер
    $trigger_sql = "
    CREATE TRIGGER update_analytics_after_session
    AFTER INSERT ON pomodoro_sessions
    FOR EACH ROW
    BEGIN
        -- Обновляем daily_stats
        INSERT INTO daily_stats (
            user_id, 
            date, 
            sessions_started, 
            sessions_completed,
            pomodoros_completed,
            total_work_minutes,
            completion_rate
        ) VALUES (
            NEW.user_id,
            DATE(NEW.start_time),
            1,
            IF(NEW.is_completed = 1, 1, 0),
            IF(NEW.is_completed = 1 AND NEW.duration >= 1200, 1, 0),
            FLOOR(NEW.duration / 60),
            IF(NEW.is_completed = 1, 100, 0)
        ) ON DUPLICATE KEY UPDATE
            sessions_started = sessions_started + 1,
            sessions_completed = sessions_completed + IF(NEW.is_completed = 1, 1, 0),
            pomodoros_completed = pomodoros_completed + IF(NEW.is_completed = 1 AND NEW.duration >= 1200, 1, 0),
            total_work_minutes = total_work_minutes + FLOOR(NEW.duration / 60),
            completion_rate = (sessions_completed / sessions_started) * 100,
            updated_at = CURRENT_TIMESTAMP;
            
        -- Обновляем hourly_stats
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
            IF(NEW.is_completed = 1 AND NEW.duration >= 1200, 1, 0),
            FLOOR(NEW.duration / 60)
        ) ON DUPLICATE KEY UPDATE
            sessions_count = sessions_count + 1,
            pomodoros_count = pomodoros_count + IF(NEW.is_completed = 1 AND NEW.duration >= 1200, 1, 0),
            total_minutes = total_minutes + FLOOR(NEW.duration / 60);
    END";

    $pdo->exec($trigger_sql);
    echo "<p>✅ Триггер update_analytics_after_session создан</p>\n";

    echo "<h3>🎉 Триггеры настроены успешно!</h3>\n";
    echo "<p><strong>Теперь аналитика будет обновляться автоматически при каждой новой сессии Pomodoro!</strong></p>\n";

    // Проверяем, что триггер создан
    $check_sql = "SHOW TRIGGERS LIKE 'update_analytics_after_session'";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute();
    $triggers = $check_stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($triggers)) {
        echo "<p>✅ Триггер активен и готов к работе</p>\n";
    }

} catch (Exception $e) {
    echo "<p>❌ Ошибка: " . $e->getMessage() . "</p>\n";
    error_log("Trigger creation error: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Настройка аналитики - ultraPOMODORO365p</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }

        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .next-steps {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }

        .warning {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="next-steps">
            <h3>📋 Следующие шаги:</h3>
            <ol>
                <li><strong>Запустите инициализацию таблиц:</strong><br>
                    Откройте в браузере: <code>http://ваш-домен/backend/init_analytics_tables.php</code>
                </li>
                <li><strong>Начните использовать Pomodoro таймер</strong><br>
                    Каждая новая сессия будет автоматически добавляться в аналитику
                </li>
                <li><strong>Проверьте аналитику в приложении</strong><br>
                    Откройте раздел "📊 Продвинутая аналитика" и насладитесь реальными данными!
                </li>
            </ol>
        </div>

        <div class="warning">
            <h4>⚠️ Важно:</h4>
            <p>Убедитесь, что таблица <code>pomodoro_sessions</code> существует в вашей базе данных. Если её нет,
                триггер не будет работать.</p>
        </div>
    </div>
</body>

</html>