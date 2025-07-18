<?php
include_once '../config/cors.php';

// Устанавливаем временную зону для корректной работы с датами
date_default_timezone_set('Europe/Moscow');

// Log that the script is accessed
error_log("create_session.php accessed.");

include_once '../config/database.php';
include_once 'PomodoroSession.php';

$database = new Database();
$db = $database->getConnection();

$session = new PomodoroSession($db);

$data = json_decode(file_get_contents("php://input"));

// Log the received data
error_log("Received data: " . print_r($data, true));

if (
    !empty($data->user_id) &&
    !empty($data->start_time) &&
    !empty($data->end_time) &&
    !empty($data->duration)
) {
    $session->user_id = $data->user_id;
    $session->start_time = $data->start_time;
    $session->end_time = $data->end_time;
    $session->duration = $data->duration;
    $session->is_completed = $data->is_completed ?? true;

    if ($session->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "Pomodoro session was created successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create pomodoro session."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create pomodoro session. Data is incomplete."));
}
?>