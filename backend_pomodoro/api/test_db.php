<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if ($db) {
        echo json_encode([
            "status" => "success",
            "message" => "Database connection successful",
            "time" => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Database connection failed",
            "time" => date('Y-m-d H:i:s')
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Error: " . $e->getMessage(),
        "time" => date('Y-m-d H:i:s')
    ]);
}
?>