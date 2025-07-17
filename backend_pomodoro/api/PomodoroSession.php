<?php
class PomodoroSession
{
    private $conn;
    private $table_name = "pomodoro_sessions";

    public $id;
    public $user_id;
    public $start_time;
    public $end_time;
    public $duration;
    public $is_completed;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        // Log that the create method is called
        error_log("PomodoroSession create method called.");

        $query = "INSERT INTO " . $this->table_name . "
                SET
                    user_id = :user_id,
                    start_time = :start_time,
                    end_time = :end_time,
                    duration = :duration,
                    is_completed = :is_completed";

        $stmt = $this->conn->prepare($query);

        // Sanitize input
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->duration = htmlspecialchars(strip_tags($this->duration));
        $this->is_completed = htmlspecialchars(strip_tags($this->is_completed));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":start_time", $this->start_time);
        $stmt->bindParam(":end_time", $this->end_time);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":is_completed", $this->is_completed);

        // Log the query and parameters (optional, be cautious with sensitive data)
        // error_log("Insert Query: " . $query);
        // error_log("Params: user_id=" . $this->user_id . ", start_time=" . $this->start_time . ", end_time=" . $this->end_time . ", duration=" . $this->duration . ", is_completed=" . $this->is_completed);

        if ($stmt->execute()) {
            // Log successful insertion
            error_log("Pomodoro session inserted successfully.");
            return true;
        } else {
            // Log insertion failure and potential error info
            error_log("Failed to insert pomodoro session.");
            // You might add logging for $stmt->errorInfo() here in a real debugging scenario
            return false;
        }
    }

    public function getDailySessions($user_id, $date)
    {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE user_id = :user_id
                AND DATE(start_time) = :date
                ORDER BY start_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":date", $date);
        $stmt->execute();

        return $stmt;
    }

    public function getTotalPomodoros($user_id)
    {
        // Правильная логика: помодоро засчитывается только за полные 25 минут
        $query = "SELECT FLOOR(SUM(duration) / 60 / 25) as total FROM " . $this->table_name . "
                WHERE user_id = :user_id
                AND is_completed = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row['total'] ?? 0;
    }
}
?>