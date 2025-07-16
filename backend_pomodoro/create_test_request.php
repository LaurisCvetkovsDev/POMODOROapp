<?php
// Script to create a test friend request
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once 'config/database.php';

echo "<h2>Create Test Friend Request</h2>\n";

try {
    $database = new Database();
    $db = $database->getConnection();

    if ($db === null) {
        throw new Exception("Database connection failed.");
    }

    echo "✅ Database connection successful<br>\n";

    // Create a test friend request TO the current user
    // Based on your database, you're likely User ID 2 (LauCvetDev)
    $sender_user_id = 4; // Nikita
    $receiver_user_id = 2; // LauCvetDev (change this to your actual user ID)

    echo "🔍 Creating friend request from User ID {$sender_user_id} to User ID {$receiver_user_id}<br>\n";

    // Check if request already exists
    $check_query = "SELECT id FROM friends WHERE 
                   (user_id = :sender AND friend_id = :receiver) OR 
                   (user_id = :receiver AND friend_id = :sender)";
    $stmt = $db->prepare($check_query);
    $stmt->bindParam(":sender", $sender_user_id);
    $stmt->bindParam(":receiver", $receiver_user_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo "⚠️ Friend request already exists between these users<br>\n";

        // Show existing relationships
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "📋 Existing relationship ID: {$existing['id']}<br>\n";
    } else {
        // Create the friend request
        $insert_query = "INSERT INTO friends (user_id, friend_id, status, created_at) 
                        VALUES (:sender, :receiver, 'pending', NOW())";
        $stmt = $db->prepare($insert_query);
        $stmt->bindParam(":sender", $sender_user_id);
        $stmt->bindParam(":receiver", $receiver_user_id);

        if ($stmt->execute()) {
            $new_id = $db->lastInsertId();
            echo "✅ Test friend request created successfully!<br>\n";
            echo "📤 From: User ID {$sender_user_id} (Nikita)<br>\n";
            echo "📥 To: User ID {$receiver_user_id} (LauCvetDev)<br>\n";
            echo "🆔 Friendship ID: {$new_id}<br>\n";
            echo "<br><strong>Now log in as LauCvetDev and you should see the notification!</strong><br>\n";
        } else {
            echo "❌ Failed to create test friend request<br>\n";
        }
    }

    // Show current friends table state
    echo "<br><h3>Current Friends Table</h3>\n";
    $all_query = "SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at,
                         u1.username as sender_name, u2.username as receiver_name
                  FROM friends f
                  LEFT JOIN users u1 ON f.user_id = u1.id
                  LEFT JOIN users u2 ON f.friend_id = u2.id
                  ORDER BY f.created_at DESC LIMIT 10";
    $stmt = $db->prepare($all_query);
    $stmt->execute();

    echo "<table border='1'><tr><th>ID</th><th>Sender</th><th>Receiver</th><th>Status</th><th>Created</th></tr>\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['sender_name']} (ID: {$row['user_id']})</td>";
        echo "<td>{$row['receiver_name']} (ID: {$row['friend_id']})</td>";
        echo "<td><strong>{$row['status']}</strong></td>";
        echo "<td>{$row['created_at']}</td>";
        echo "</tr>\n";
    }
    echo "</table><br>\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>\n";
}
?>