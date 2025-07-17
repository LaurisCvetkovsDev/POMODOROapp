<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../classes/User.php';



$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $user->email = $data->email;
    $user->password = $data->password;

    if ($user->login()) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Login successful.",
            "user" => array(
                "id" => $user->id,
                "username" => $user->username,
                "email" => $user->email,
                "avatar_url" => $user->avatar_url
            )
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid email or password."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to login. Data is incomplete."));
}
?>