<?php

class User
{
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password;
    public $password_hash;
    public $avatar_url;
    public $created_at;
    public $last_login;
    public $new_password;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    username = :username,
                    email = :email,
                    password_hash = :password_hash,
                    avatar_url = :avatar_url,
                    created_at = :created_at";

        $stmt = $this->conn->prepare($query);

        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password_hash = password_hash($this->password, PASSWORD_DEFAULT);
        $this->avatar_url = "https://www.gravatar.com/avatar/" . md5(strtolower(trim($this->email))) . "?d=identicon&s=200";
        $this->created_at = date('Y-m-d H:i:s');

        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":avatar_url", $this->avatar_url);
        $stmt->bindParam(":created_at", $this->created_at);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function emailExists()
    {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function usernameExists()
    {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function login()
    {
        $query = "SELECT id, username, email, password_hash, avatar_url FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($this->password, $row['password_hash'])) {
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->email = $row['email'];
                $this->avatar_url = $row['avatar_url'];

                // Update last login
                $query = "UPDATE " . $this->table_name . " SET last_login = :last_login WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $this->last_login = date('Y-m-d H:i:s');
                $stmt->bindParam(":last_login", $this->last_login);
                $stmt->bindParam(":id", $this->id);
                $stmt->execute();

                return true;
            }
        }
        return false;
    }

    public function resetPassword()
    {
        $query = "SELECT id, password_hash FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($this->password, $row['password_hash'])) {
                $query = "UPDATE " . $this->table_name . " SET password_hash = :password_hash WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $password_hash = password_hash($this->new_password, PASSWORD_DEFAULT);
                $stmt->bindParam(":password_hash", $password_hash);
                $stmt->bindParam(":id", $row['id']);
                return $stmt->execute();
            }
        }
        return false;
    }

    public function findByUsername($username)
    {
        $query = "SELECT id, username, email FROM " . $this->table_name . " WHERE username = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $username);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row;
    }
}