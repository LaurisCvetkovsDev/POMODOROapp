<?php
// Enable error reporting

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Prevent caching for dynamic API responses
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start output buffering to catch any unexpected output
ob_start();

try {
    include_once '../config/database.php';
    include_once 'Friend.php';
    include_once __DIR__ . '/../classes/User.php';

    $database = new Database();
    $db = $database->getConnection();

    // Check if database connection was successful
    if ($db === null) {
        throw new Exception("Database connection failed.");
    }

    $friend = new Friend($db);
    $user_obj = new User($db);

    // Get the action from GET parameters
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // Only attempt to read and decode JSON for actions that require a body
    $data = null; // Initialize data to null
    if ($action === 'add' || $action === 'accept' || $action === 'remove') {
        $json_input = file_get_contents("php://input");
        $data = json_decode($json_input);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON data received for action: " . $action);
        }
    }

    switch ($action) {
        case 'add':
            // Expect user_id and friend_username from $data
            if ($data === null || empty($data->user_id) || empty($data->friend_username)) {
                http_response_code(400);
                echo json_encode(array("message" => "Unable to send friend request. User ID and Friend Username are required."));
                break;
            }
            $friend->user_id = $data->user_id;
            $friend_username = $data->friend_username;

            // Find friend_id by username
            $friend_user = $user_obj->findByUsername($friend_username);

            if ($friend_user) {
                // Found the user, now set the friend_id
                $friend->friend_id = $friend_user['id'];

                // Prevent adding self as friend
                if ($friend->user_id == $friend->friend_id) {
                    http_response_code(400);
                    echo json_encode(array("message" => "You cannot add yourself as a friend."));
                    break;
                }

                // Proceed with adding the friend request
                if ($friend->addFriend()) {
                    http_response_code(201);
                    echo json_encode(array("message" => "Friend request sent successfully."));
                } else {
                    // This could be due to already being friends or a pending request
                    http_response_code(503);
                    echo json_encode(array("message" => "Unable to send friend request. They might already be your friend or have a pending request."));
                }
            } else {
                // Friend username not found
                http_response_code(404);
                echo json_encode(array("message" => "User with that username not found."));
            }
            break;

        case 'accept':
            if (!empty($data->friendship_id)) {
                error_log("Accept request: friendship_id={$data->friendship_id}");
                $friend->id = $data->friendship_id;

                if ($friend->acceptFriend()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Friend request accepted successfully."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Unable to accept friend request."));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Unable to accept friend request. Friendship ID is required."));
            }
            break;

        case 'remove':
            if (!empty($data->friendship_id)) {
                error_log("Remove request: friendship_id={$data->friendship_id}");
                $friend->id = $data->friendship_id;

                if ($friend->removeFriend()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Friend removed successfully."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Unable to remove friend."));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Unable to remove friend. Friendship ID is required."));
            }
            break;

        case 'list':
            if (!empty($_GET['user_id'])) {
                $stmt = $friend->getFriends($_GET['user_id']);
                $num = $stmt->rowCount();

                if ($num > 0) {
                    $friends_arr = array();
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        // Don't use extract() as it can cause issues with null values
                        // Instead, explicitly assign each field
                        $friend_item = array(
                            "id" => $row['id'],
                            "user_id" => $row['user_id'],
                            "friend_id" => $row['friend_id'],
                            "username" => $row['username'],
                            "avatar_url" => $row['avatar_url'],
                            "status" => $row['status'],
                            "created_at" => $row['created_at'],
                            "total_pomodoros" => $row['total_pomodoros'] ?? 0,
                            "daily_pomodoros" => $row['daily_pomodoros'] ?? 0
                        );
                        array_push($friends_arr, $friend_item);
                    }

                    // Log the data before sending
                    error_log("Friends list data: " . json_encode($friends_arr));

                    http_response_code(200);
                    echo json_encode($friends_arr);
                } else {
                    // Log the empty array before sending
                    error_log("Friends list data: []");

                    http_response_code(200);
                    echo json_encode(array());
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Unable to get friends list. User ID is required."));
            }
            break;

        case 'get_user_counts':
            if (!isset($_GET['user_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID is required']);
                exit;
            }

            try {
                $user_id = (int) $_GET['user_id'];
                $counts = $friend->getUserCounts($user_id);

                http_response_code(200);
                echo json_encode([
                    'total_pomodoros' => (int) $counts['total_pomodoros'],
                    'daily_pomodoros' => (int) $counts['daily_pomodoros']
                ]);
            } catch (Exception $e) {
                error_log("Error in get_user_counts: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to get user counts']);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(array("message" => "Invalid action."));
            break;
    }
} catch (Exception $e) {
    // Clear any output
    ob_clean();

    // Log the error
    error_log("Friend actions error: " . $e->getMessage());

    // Send JSON error response
    http_response_code(500);
    echo json_encode(array("message" => "An error occurred: " . $e->getMessage()));
}

// End output buffering and send the response
ob_end_flush();
?>