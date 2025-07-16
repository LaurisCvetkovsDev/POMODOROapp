<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "status" => "success",
    "message" => "API is working",
    "time" => date('Y-m-d H:i:s')
]);
?>