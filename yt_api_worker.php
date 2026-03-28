<?php
// yt_api_worker.php

/**
 * PRODUCTION HARDENING
 */
error_reporting(0); 
ini_set('display_errors', 0);

require_once 'env_loader.php';

// HELPER FUNCTION: The "Universal" Fetcher (Classic PHP Compatibility)
function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);

    // AUTO-FLIP: If SSL fails, retry once without verification
    if ($response === false) {
        $errno = curl_errno($ch);
        if ($errno === 60 || $errno === 77) { 
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
        }
    }

    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($http_code === 200) ? $response : false;
}

// 1. IMAGE PROXY
if (isset($_GET['thumb_id'])) {
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['thumb_id']); 
    $quality = isset($_GET['q']) ? $_GET['q'] : 'mqdefault';
    $img_url = "https://i.ytimg.com/vi/$id/$quality.jpg";

    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=604800'); 

    $img_data = fetchUrl($img_url);
    if ($img_data) {
        echo $img_data;
    } else {
        echo base64_decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
    }
    exit;
}

// 2. CONFIGURATION
$api_key = get_env_key('YT_API_KEY');
$playlist_id = 'PLmDR5c5g8kT9bWuDa5KnJy9cciro8N8Ex';
$cache_file = __DIR__ . '/yt_api_cache.json';
$cache_time = 3600; 

if (!$api_key) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(array("error" => ".env key missing"));
    exit;
}

// 3. SERVE FROM CACHE
if (file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_time)) {
    header('Content-Type: application/json');
    echo file_get_contents($cache_file);
    exit;
}

// 4. FETCH PLAYLIST ITEMS
$playlistUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=$playlist_id&key=$api_key";
$playlistResponse = fetchUrl($playlistUrl);

if (!$playlistResponse) {
    if (file_exists($cache_file)) {
        header('Content-Type: application/json');
        echo file_get_contents($cache_file);
        exit;
    }
    header('Content-Type: application/json', true, 500);
    echo json_encode(array('error' => 'Failed to fetch playlist items'));
    exit;
}

$playlistData = json_decode($playlistResponse, true);
if (!isset($playlistData['items']) || !is_array($playlistData['items'])) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(array('error' => 'Invalid playlist data'));
    exit;
}

$videoIds = array();
$videosMap = array();

foreach ($playlistData['items'] as $item) {
    $vid = isset($item['snippet']['resourceId']['videoId']) ? $item['snippet']['resourceId']['videoId'] : null;
    $title = isset($item['snippet']['title']) ? $item['snippet']['title'] : '';

    if (!$vid || $title === 'Private video' || $title === 'Deleted video') continue;

    $videoIds[] = $vid;
    $videosMap[$vid] = array(
        'title' => $title,
        'id' => $vid,
        'real_ts' => 0
    );
}

// 5. FETCH REAL VIDEO DATA
if (!empty($videoIds)) {
    $ids = implode(',', $videoIds);
    $videoUrl = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=$ids&key=$api_key";
    $videoResponse = fetchUrl($videoUrl);

    if ($videoResponse) {
        $videoData = json_decode($videoResponse, true);
        if (isset($videoData['items']) && is_array($videoData['items'])) {
            foreach ($videoData['items'] as $v) {
                $vid = isset($v['id']) ? $v['id'] : null;
                $publishedAt = isset($v['snippet']['publishedAt']) ? strtotime($v['snippet']['publishedAt']) : 0;
                if ($vid && isset($videosMap[$vid])) {
                    $videosMap[$vid]['real_ts'] = $publishedAt;
                }
            }
        }
    }
}

// 6. CONVERT TO LIST & SORT (Classic Function for PHP 7.3/Lower)
$clean_videos = array_values($videosMap);
usort($clean_videos, function($a, $b) {
    $tsA = isset($a['real_ts']) ? $a['real_ts'] : 0;
    $tsB = isset($b['real_ts']) ? $b['real_ts'] : 0;
    if ($tsA == $tsB) return 0;
    return ($tsB < $tsA) ? -1 : 1;
});

// 7. CACHE WRITE
$final_json = json_encode($clean_videos);
if ($final_json !== false && $final_json !== '[]') {
    @file_put_contents($cache_file, $final_json);
}

// 8. OUTPUT
if ((!$final_json || $final_json === '[]') && file_exists($cache_file)) {
    $final_json = file_get_contents($cache_file);
}

header('Content-Type: application/json');
echo $final_json;