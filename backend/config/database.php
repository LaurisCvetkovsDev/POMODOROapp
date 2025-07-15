<?php
// Load environment variables


class Database
{
    private $host;
    private $db_name;
    private $username;
    private $password;

    public $conn;

    public function __construct()
    {
        // Load database settings from environment variables
        $this->host = $_ENV["DB_HOST"];
        $this->db_name = $_ENV["DB_NAME"];
        $this->username = $_ENV["DB_USERNAME"];
        $this->password = $_ENV["DB_PASSWORD"];
    }

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch (PDOException $e) {
            // Log the error instead of outputting it
            error_log("Database connection error: " . $e->getMessage());
            return null;
        }

        return $this->conn;
    }
}
?>