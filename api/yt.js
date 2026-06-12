// Vercel serverless function — replaces the old PHP `yt_api_worker.php`.
// Runs on Vercel (no PHP runtime) and needs NO API key: the playlist is read
// from YouTube's public RSS feed, and thumbnails are proxied so Google never
// sees the visitor's IP (GDPR), matching the original PHP behaviour.

const PLAYLIST_ID = "PLmDR5c5g8kT9bWuDa5KnJy9cciro8N8Ex";

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

module.exports = async (req, res) => {
  const query = req.query || {};
  const thumbId = query.thumb_id;

  // 1) Thumbnail proxy: /api/yt?thumb_id=<id>&q=<quality>
  if (thumbId) {
    const id = String(thumbId).replace(/[^a-zA-Z0-9_-]/g, "");
    const quality = /^[a-z]+$/.test(String(query.q || "")) ? query.q : "mqdefault";
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${quality}.jpg`);
      if (!r.ok) {
        res.status(404).end();
        return;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.status(200).send(buf);
    } catch (e) {
      res.status(502).end();
    }
    return;
  }

  // 2) Playlist JSON from the keyless YouTube RSS feed -> [{ id, title }]
  try {
    const r = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`,
    );
    if (!r.ok) {
      res.status(502).json({ error: "feed unavailable" });
      return;
    }
    const xml = await r.text();
    const videos = [];
    // Split on <entry> so the feed-level <title> (before the first entry) is skipped.
    const entries = xml.split("<entry>").slice(1);
    for (const entry of entries) {
      const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      if (idMatch && titleMatch) {
        videos.push({
          id: idMatch[1].trim(),
          title: decodeEntities(titleMatch[1].trim()),
        });
      }
    }
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.status(200).json(videos);
  } catch (e) {
    res.status(502).json({ error: "fetch failed" });
  }
};
