<?php
function get_env_key($key_name) {
    $path = __DIR__ . '/.env';
    if (!file_exists($path)) return null;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue; // Skip comments/empty
        
        // Ensure the line actually contains an equals sign before exploding
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            if (trim($name) === $key_name) {
                // Remove potential quotes if you use them in .env (e.g., KEY="VALUE")
                return trim($value, " \t\n\r\0\x0B\"'");
            }
        }
    }
    return null;
}