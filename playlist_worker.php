<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$playlist_id = 'PLmDR5c5g8kT9bWuDa5KnJy9cciro8N8Ex';
$rss_url = "https://www.youtube.com/feeds/videos.xml?playlist_id=" . $playlist_id;

$xml_content = @file_get_contents($rss_url);
if (!$xml_content) {
    echo json_encode(['error' => 'Could not load feed']);
    exit;
}

$xml = simplexml_load_string($xml_content);
$videos = [];

foreach ($xml->entry as $entry) {
    $published_string = (string) $entry->published;

    $videos[] = [
        'id' => str_replace('yt:video:', '', (string) $entry->id),
        'title' => (string) $entry->title,
        'link' => (string) $entry->link['href'],
        'timestamp' => strtotime($published_string)
    ];
}

usort($videos, function ($a, $b) {
    return $b['timestamp'] <=> $a['timestamp'];
});

echo json_encode($videos);