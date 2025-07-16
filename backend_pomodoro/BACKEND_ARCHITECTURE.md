# Pomodoro App - Backend Architecture Documentation

## Обзор архитектуры бэкенда

Backend Pomodoro приложения построен на **PHP** с использованием **MySQL** базы данных и RESTful API архитектуры.

## Основные классы

### Database Class

```php
class Database {
    private $host = "localhost";
    private $db_name = "pomodorodb";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection(): PDO
}
```

### User Class

```php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password_hash;
    public $avatar_url;

    public function create(): bool;
    public function login(): bool;
    public function resetPassword(): bool;
    public function findByUsername($username): array;
}
```

### Friend Class

```php
class Friend {
    private $conn;
    private $table_name = "friends";

    public $id;
    public $user_id;
    public $friend_id;
    public $status;

    public function addFriend(): bool;
    public function acceptFriend(): bool;
    public function getFriends($user_id): PDOStatement;
    public function removeFriend(): bool;
}
```

### PomodoroSession Class

```php
class PomodoroSession {
    private $conn;
    private $table_name = "pomodoro_sessions";

    public $id;
    public $user_id;
    public $start_time;
    public $end_time;
    public $duration;
    public $is_completed;

    public function create(): bool;
    public function getDailySessions($user_id, $date): PDOStatement;
    public function getTotalPomodoros($user_id): int;
}
```

## API Endpoints

- **Authentication**: login.php, register.php, reset_password.php
- **Friends**: friend_actions.php
- **Sessions**: create_session.php
- **Analytics**: analytics.php

## Database Schema

### Core Tables

- **users** - Пользователи системы
- **friends** - Связи дружбы между пользователями
- **pomodoro_sessions** - Записи о Pomodoro сессиях
- **daily_stats** - Ежедневная статистика

Эта архитектура обеспечивает надежность и масштабируемость backend системы.
