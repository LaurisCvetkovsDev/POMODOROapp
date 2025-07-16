<?php

class Friend
{
    private $conn;
    private $table_name = "friends";

    public $id;
    public $user_id;
    public $friend_id;
    public $status;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function addFriend()
    {
        try {
            // First check if friendship already exists
            $check_query = "SELECT id FROM " . $this->table_name . "
                           WHERE (user_id = :user_id AND friend_id = :friend_id)
                           OR (user_id = :friend_id AND friend_id = :user_id)";

            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->bindParam(":user_id", $this->user_id);
            $check_stmt->bindParam(":friend_id", $this->friend_id);
            $check_stmt->execute();

            if ($check_stmt->rowCount() > 0) {
                error_log("Friend relationship already exists between user {$this->user_id} and {$this->friend_id}");
                return false;
            }

            $query = "INSERT INTO " . $this->table_name . "
                    SET
                        user_id = :user_id,
                        friend_id = :friend_id,
                        status = 'pending'";

            $stmt = $this->conn->prepare($query);

            // Sanitize input
            $this->user_id = htmlspecialchars(strip_tags($this->user_id));
            $this->friend_id = htmlspecialchars(strip_tags($this->friend_id));

            // Bind values
            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":friend_id", $this->friend_id);

            if ($stmt->execute()) {
                error_log("Friend request created: user {$this->user_id} -> friend {$this->friend_id}");
                return true;
            }

            error_log("Failed to execute friend request insert");
            return false;
        } catch (PDOException $e) {
            error_log("Error in addFriend: " . $e->getMessage());
            return false;
        }
    }

    public function acceptFriend()
    {
        try {
            error_log("Attempting to accept friend request with ID: {$this->id}");

            $query = "UPDATE " . $this->table_name . "
                    SET status = 'accepted'
                    WHERE id = :friendship_id
                    AND status = 'pending'";

            $stmt = $this->conn->prepare($query);

            // Sanitize input
            $this->id = htmlspecialchars(strip_tags($this->id));

            // Bind values
            $stmt->bindParam(":friendship_id", $this->id);

            if ($stmt->execute()) {
                $affected_rows = $stmt->rowCount();
                error_log("Friend request accepted. Affected rows: {$affected_rows}");
                return $affected_rows > 0;
            }

            error_log("Failed to execute friend accept query");
            return false;
        } catch (PDOException $e) {
            error_log("Error in acceptFriend: " . $e->getMessage());
            return false;
        }
    }

    public function getFriends($user_id)
    {
        $query = "SELECT
                    f.id,
                    f.user_id,
                    f.friend_id,
                    u.username,
                    u.avatar_url,
                    f.status,
                    f.created_at,
                    (SELECT FLOOR(SUM(ps.duration) / 60 / 25) FROM pomodoro_sessions ps WHERE ps.user_id = u.id) as total_pomodoros,
                    (SELECT FLOOR(SUM(ps.duration) / 60 / 25) FROM pomodoro_sessions ps WHERE ps.user_id = u.id AND DATE(ps.start_time) = CURDATE()) as daily_pomodoros
                FROM " . $this->table_name . " f
                JOIN users u ON (f.friend_id = u.id)
                WHERE f.user_id = :user_id1 AND f.status = 'accepted'
                UNION
                SELECT
                    f.id,
                    f.user_id,
                    f.friend_id,
                    u.username,
                    u.avatar_url,
                    f.status,
                    f.created_at,
                    (SELECT COUNT(*) FROM pomodoro_sessions ps WHERE ps.user_id = u.id AND ps.is_completed = 1) as total_pomodoros,
                    (SELECT COUNT(*) FROM pomodoro_sessions ps WHERE ps.user_id = u.id AND ps.is_completed = 1 AND DATE(ps.start_time) = CURDATE()) as daily_pomodoros
                FROM " . $this->table_name . " f
                JOIN users u ON (f.user_id = u.id)
                WHERE f.friend_id = :user_id2 AND f.status = 'accepted'
                UNION
                SELECT
                    f.id,
                    f.user_id,
                    f.friend_id,
                    u.username,
                    u.avatar_url,
                    f.status,
                    f.created_at,
                    (SELECT COUNT(*) FROM pomodoro_sessions ps WHERE ps.user_id = u.id AND ps.is_completed = 1) as total_pomodoros,
                    (SELECT COUNT(*) FROM pomodoro_sessions ps WHERE ps.user_id = u.id AND ps.is_completed = 1 AND DATE(ps.start_time) = CURDATE()) as daily_pomodoros
                FROM " . $this->table_name . " f
                JOIN users u ON (f.user_id = u.id)
                WHERE f.friend_id = :user_id3 AND f.status = 'pending'
                ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id1", $user_id);
        $stmt->bindParam(":user_id2", $user_id);
        $stmt->bindParam(":user_id3", $user_id);
        $stmt->execute();

        return $stmt;
    }

    public function getUserCounts($user_id)
    {
        try {
            // Get today's date in Y-m-d format
            $today = date('Y-m-d');

            // Query to get total and daily pomodoro counts (25 minutes = 1 pomodoro)
            $query = "SELECT 
                (SELECT FLOOR(SUM(duration) / 60 / 25) FROM pomodoro_sessions WHERE user_id = :user_id) as total_pomodoros,
                (SELECT FLOOR(SUM(duration) / 60 / 25) FROM pomodoro_sessions WHERE user_id = :user_id AND DATE(start_time) = :today) as daily_pomodoros";

            $stmt = $this->conn->prepare($query);

            // Bind parameters
            $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
            $stmt->bindParam(":today", $today);

            // Execute the query
            $stmt->execute();

            // Fetch the result
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            // Return the result or default values if no result
            return $result ?: ['total_pomodoros' => 0, 'daily_pomodoros' => 0];

        } catch (PDOException $e) {
            error_log("Error in getUserCounts: " . $e->getMessage());
            return ['total_pomodoros' => 0, 'daily_pomodoros' => 0];
        }
    }

    public function removeFriend()
    {
        try {
            error_log("Attempting to remove friend request with ID: {$this->id}");

            $query = "DELETE FROM " . $this->table_name . "
                    WHERE id = :friendship_id";

            $stmt = $this->conn->prepare($query);

            // Sanitize input
            $this->id = htmlspecialchars(strip_tags($this->id));

            // Bind values
            $stmt->bindParam(":friendship_id", $this->id);

            if ($stmt->execute()) {
                $affected_rows = $stmt->rowCount();
                error_log("Friend request removed. Affected rows: {$affected_rows}");
                return $affected_rows > 0;
            }

            error_log("Failed to execute friend remove query");
            return false;
        } catch (PDOException $e) {
            error_log("Error in removeFriend: " . $e->getMessage());
            return false;
        }
    }
}
?>