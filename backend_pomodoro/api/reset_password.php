<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../classes/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->email) &&
    !empty($data->current_password) &&
    !empty($data->new_password)
) {
    $user->email = $data->email;
    $user->password = $data->current_password;
    $user->new_password = $data->new_password;

    if ($user->resetPassword()) {
        http_response_code(200);
        echo json_encode(array("message" => "Password reset successful."));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid current password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to reset password. Data is incomplete."));
}
?>