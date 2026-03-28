<?php
// yt_api_worker.php

/**
 * PRODUCTION HARDENING
 * Uncomment the two lines below when moving to your live server.
 * This prevents path leaks and keeps your API environment secure.
 */
// error_reporting(0); 
// ini_set('display_errors', 0);

require_once 'env_loader.php';

// 1. IMAGE PROXY (GDPR Fix)
if (isset($_GET['thumb_id'])) {
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['thumb_id']); 
    $quality = isset($_GET['q']) ? $_GET['q'] : 'mqdefault';
    $img_url = "https://i.ytimg.com/vi/$id/$quality.jpg";
    
    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=604800'); 
    @readfile($img_url);
    exit;
}

// 2. CONFIGURATION
$api_key = get_env_key('YT_API_KEY');
$playlist_id = 'PLmDR5c5g8kT9bWuDa5KnJy9cciro8N8Ex'; 
$cache_file = 'yt_api_cache.json';
$cache_time = 3600; 

if (!$api_key) {
    header('Content-Type: application/json', true, 500);
    die(json_encode(["error" => ".env key missing"]));
}

// 3. SERVE FROM CACHE
if (file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_time)) {
    header('Content-Type: application/json');
    echo file_get_contents($cache_file);
    exit;
}

// 4. FETCH FROM GOOGLE
$url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=$playlist_id&key=$api_key";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($http_code === 200) {
    $data = json_decode($response, true);
    $clean_videos = [];
    
    if (isset($data['items'])) {
        foreach ($data['items'] as $item) {
            $title = $item['snippet']['title'];

            // SKIP: Don't add private or deleted videos to the list
            if ($title === 'Private video' || $title === 'Deleted video') {
                continue;
            }

            $clean_videos[] = [
                'title' => $title,
                'id'    => $item['snippet']['resourceId']['videoId'],
                'date'  => $item['snippet']['publishedAt'] ?? '1970-01-01T00:00:00Z'
            ];
        }
    }

    // --- ENHANCED SORT: Newest First ---
    usort($clean_videos, function($a, $b) {
        $dateA = strtotime($a['date']);
        $dateB = strtotime($b['date']);
        
        if ($dateA == $dateB) return 0;
        return ($dateB > $dateA) ? 1 : -1;
    });

    $final_json = json_encode($clean_videos);
    file_put_contents($cache_file, $final_json);
    
    header('Content-Type: application/json');
    echo $final_json;
} else {
    if (file_exists($cache_file)) {
        header('Content-Type: application/json');
        echo file_get_contents($cache_file);
    } else {
        header('Content-Type: application/json', true, $http_code);
        echo $response;
    }
}