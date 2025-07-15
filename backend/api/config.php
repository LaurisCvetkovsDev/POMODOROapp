<?php
$host = "pomodorodb.laucve1.dreamhosters.com";
$username = "laucvetdev";
$password = "LauCvetDev123";
$database = "pomodorodb";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>