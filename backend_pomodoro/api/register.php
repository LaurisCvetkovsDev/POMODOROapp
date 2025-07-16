<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../classes/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->username) &&
    !empty($data->email) &&
    !empty($data->password)
) {
    $user->username = $data->username;
    $user->email = $data->email;
    $user->password = $data->password;

    if ($user->emailExists()) {
        http_response_code(400);
        echo json_encode(array("message" => "Email already exists."));
        exit();
    }

    if ($user->usernameExists()) {
        http_response_code(400);
        echo json_encode(array("message" => "Username already exists."));
        exit();
    }

    if ($user->create()) {
        http_response_code(201);
        echo json_encode(array(
            "message" => "User was created successfully.",
            "user" => array(
                "id" => $user->id,
                "username" => $user->username,
                "email" => $user->email,
                "avatar_url" => $user->avatar_url
            )
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create user."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create user. Data is incomplete."));
}
?>