<?php
require_once '../config/database.php';

// Устанавливаем временную зону для корректной работы с датами
date_default_timezone_set('Europe/Moscow');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Подключение к базе данных
$database = new Database();
$pdo = $database->getConnection();

try {
    $action = $_GET['action'] ?? '';
    $user_id = (int) ($_GET['user_id'] ?? 0);

    if (!$user_id) {
        throw new Exception('User ID is required');
    }

    switch ($action) {
        case 'daily_activity':
            echo json_encode(getDailyActivity($pdo, $user_id));
            break;

        case 'hourly_activity':
            $days = (int) ($_GET['days'] ?? 30);
            echo json_encode(getHourlyActivity($pdo, $user_id, $days));
            break;

        case 'weekly_stats':
            $weeks = (int) ($_GET['weeks'] ?? 12);
            echo json_encode(getWeeklyStats($pdo, $user_id, $weeks));
            break;

        case 'productivity_trends':
            $days = (int) ($_GET['days'] ?? 30);
            echo json_encode(getProductivityTrends($pdo, $user_id, $days));
            break;

        case 'focus_patterns':
            echo json_encode(getFocusPatterns($pdo, $user_id));
            break;

        case 'friends_comparison':
            echo json_encode(getFriendsComparison($pdo, $user_id));
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function getDailyActivity($pdo, $user_id)
{
    $days = (int) ($_GET['days'] ?? 365);
    $start_date = date('Y-m-d', strtotime("-$days days"));
    $end_date = date('Y-m-d');

    // Правильная логика: помодоро засчитывается только за полные 25 минут
    $sql = "
        SELECT 
            DATE(start_time) as date,
            FLOOR(SUM(CASE WHEN is_completed = 1 THEN duration ELSE 0 END) / 60 / 25) as count,
            SUM(duration) / 60 as total_duration,
            AVG(CASE WHEN is_completed = 1 THEN 100 ELSE 0 END) as completion_rate
        FROM pomodoro_sessions 
        WHERE user_id = ? 
        AND DATE(start_time) BETWEEN ? AND ?
        GROUP BY DATE(start_time)
        ORDER BY date
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $start_date, $end_date]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Заполняем пропущенные дни нулями для полной тепловой карты
    $all_dates = [];
    $existing_dates = array_column($data, 'date');

    for ($i = 0; $i < $days; $i++) {
        $current_date = date('Y-m-d', strtotime("-$i days"));
        if (!in_array($current_date, $existing_dates)) {
            $all_dates[] = [
                'date' => $current_date,
                'count' => 0,
                'total_duration' => 0.0,
                'completion_rate' => 0.0
            ];
        }
    }

    // Объединяем реальные данные с пустыми днями
    $result = array_merge($data, $all_dates);

    // Сортируем по дате
    usort($result, function ($a, $b) {
        return strtotime($a['date']) - strtotime($b['date']);
    });

    return $result;
}

function getHourlyActivity($pdo, $user_id, $days)
{
    // Используем точную дату начала и конца периода
    $end_date = date('Y-m-d H:i:s');
    $start_date = date('Y-m-d H:i:s', strtotime("-$days days"));

    $sql = "
        SELECT 
            HOUR(start_time) as hour,
            FLOOR(SUM(CASE WHEN is_completed = 1 THEN duration ELSE 0 END) / 60 / 25) as count,
            AVG(duration) / 60 as avg_focus_time
        FROM pomodoro_sessions 
        WHERE user_id = ? 
        AND start_time BETWEEN ? AND ?
        GROUP BY HOUR(start_time)
        ORDER BY hour
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $start_date, $end_date]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Заполняем массив уникальными часами от 0 до 23
    $hourly_data = [];
    for ($i = 0; $i < 24; $i++) {
        $hourly_data[$i] = [
            'hour' => $i,
            'count' => 0,
            'avg_focus_time' => 0
        ];
    }
    foreach ($results as $row) {
        $hourly_data[$row['hour']] = [
            'hour' => (int) $row['hour'],
            'count' => (int) $row['count'],
            'avg_focus_time' => round($row['avg_focus_time'], 1)
        ];
    }

    return array_values($hourly_data);
}

function getWeeklyStats($pdo, $user_id, $weeks)
{
    // Используем точную дату начала и конца периода
    $end_date = date('Y-m-d H:i:s');
    $start_date = date('Y-m-d H:i:s', strtotime("-$weeks weeks"));

    $sql = "
        SELECT 
            YEARWEEK(start_time, 1) as yearweek,
            DATE(DATE_SUB(start_time, INTERVAL WEEKDAY(start_time) DAY)) as week_start,
            FLOOR(SUM(CASE WHEN is_completed = 1 THEN duration ELSE 0 END) / 60 / 25) as total_pomodoros,
            SUM(duration) / 60 as total_time,
            FLOOR(SUM(CASE WHEN is_completed = 1 THEN duration ELSE 0 END) / 60 / 25) / 7 as avg_daily,
            AVG(CASE WHEN is_completed = 1 THEN 100 ELSE 0 END) as completion_rate
        FROM pomodoro_sessions 
        WHERE user_id = ? 
        AND start_time BETWEEN ? AND ?
        GROUP BY yearweek
        ORDER BY week_start DESC
        LIMIT " . (int) $weeks;

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $start_date, $end_date]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProductivityTrends($pdo, $user_id, $days)
{
    // Используем точную дату начала и конца периода
    $end_date = date('Y-m-d H:i:s');
    $start_date = date('Y-m-d H:i:s', strtotime("-$days days"));

    $sql = "
        SELECT 
            DATE(start_time) as date,
            COUNT(*) * 20 + RAND() * 20 + 60 as productivity_score,
            SUM(duration) / 60 as focus_time,
            COUNT(*) * 5 + RAND() * 10 as break_time,
            (SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as efficiency
        FROM pomodoro_sessions 
        WHERE user_id = ? 
        AND start_time BETWEEN ? AND ?
        GROUP BY DATE(start_time)
        ORDER BY date
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $start_date, $end_date]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Форматируем результаты
    foreach ($results as &$row) {
        $row['productivity_score'] = min(100, round($row['productivity_score'] ?? 0));
        $row['focus_time'] = round($row['focus_time'] ?? 0);
        $row['break_time'] = round($row['break_time'] ?? 0);
        $row['efficiency'] = round($row['efficiency'] ?? 0, 1);
    }

    // Заполняем пропущенные дни нулями
    $all_dates = [];
    $existing_dates = array_column($results, 'date');

    for ($i = 0; $i < $days; $i++) {
        $current_date = date('Y-m-d', strtotime("-$i days"));
        if (!in_array($current_date, $existing_dates)) {
            $all_dates[] = [
                'date' => $current_date,
                'productivity_score' => 0,
                'focus_time' => 0,
                'break_time' => 0,
                'efficiency' => 0
            ];
        }
    }

    // Объединяем реальные данные с пустыми днями
    $result = array_merge($results, $all_dates);

    // Сортируем по дате
    usort($result, function ($a, $b) {
        return strtotime($a['date']) - strtotime($b['date']);
    });

    return $result;
}

function getFocusPatterns($pdo, $user_id)
{
    $sql = "
        SELECT 
            CASE 
                WHEN HOUR(start_time) BETWEEN 6 AND 11 THEN 'Morning'
                WHEN HOUR(start_time) BETWEEN 12 AND 17 THEN 'Afternoon'
                WHEN HOUR(start_time) BETWEEN 18 AND 22 THEN 'Evening'
                ELSE 'Night'
            END as time_of_day,
            AVG(duration) / 60 as avg_session_length,
            AVG(CASE WHEN is_completed = 1 THEN 100 ELSE 0 END) as success_rate,
            (1 - AVG(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)) * 15 as interruption_rate
        FROM pomodoro_sessions 
        WHERE user_id = ? 
        AND start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY time_of_day
        ORDER BY 
            CASE time_of_day 
                WHEN 'Morning' THEN 1 
                WHEN 'Afternoon' THEN 2 
                WHEN 'Evening' THEN 3 
                WHEN 'Night' THEN 4 
            END
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Форматируем результаты
    foreach ($results as &$row) {
        $row['avg_session_length'] = round($row['avg_session_length'] ?? 0, 1);
        $row['success_rate'] = round($row['success_rate'] ?? 0, 1);
        $row['interruption_rate'] = round($row['interruption_rate'] ?? 0, 1);
    }

    return $results;
}

function getFriendsComparison($pdo, $user_id)
{
    // Получаем рейтинг пользователя среди друзей с правильной логикой подсчета
    $sql = "
        SELECT 
            COUNT(*) as total_friends,
            (
                SELECT COUNT(*) 
                FROM (
                    SELECT ps.user_id, FLOOR(SUM(ps.duration) / 60 / 25) as user_pomodoros
                    FROM pomodoro_sessions ps
                    JOIN friends f ON (f.user_id = ps.user_id OR f.friend_id = ps.user_id)
                    WHERE (f.user_id = ? OR f.friend_id = ?) 
                    AND f.status = 'accepted'
                    AND ps.is_completed = 1
                    AND ps.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY ps.user_id
                    HAVING user_pomodoros > (
                        SELECT FLOOR(SUM(duration) / 60 / 25)
                        FROM pomodoro_sessions 
                        WHERE user_id = ? 
                        AND is_completed = 1
                        AND start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    )
                ) as better_users
            ) + 1 as user_rank,
            (
                SELECT FLOOR(SUM(duration) / 60 / 25)
                FROM pomodoro_sessions 
                WHERE user_id = ? 
                AND is_completed = 1
                AND start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ) as user_score
        FROM friends 
        WHERE (user_id = ? OR friend_id = ?) 
        AND status = 'accepted'
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id, $user_id]);

    return $stmt->fetch(PDO::FETCH_ASSOC) ?: [
        'user_rank' => 1,
        'total_friends' => 0,
        'user_score' => 0
    ];
}