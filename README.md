# GDPR-Ready YouTube Playlist Theater

A privacy-first, high-performance YouTube gallery. This project uses a PHP middleman to proxy thumbnails (GDPR compliance) and a custom JavaScript "Mutation Engine" to handle high-resolution thumbnail fallbacks.

## Key Features

- GDPR Compliant: Thumbnails are served via your own server (yt_api_worker.php). Google never sees user IP addresses until they click play.
- Dynamic Thumbnail Recovery: Specialized JavaScript observer detects "stalled" 0px thumbnails and automatically forces an HQ fallback.
- Smart Caching: API results are cached locally for 1 hour to stay within the free 10,000 units/day quota.
- Auto-Sorting: Displays the latest uploads first by default using server-side usort.
- Clean Sidebar: Automatically filters out "Private" or "Deleted" videos from the playlist.

## Setup Instructions

### 1. Prerequisites

- PHP 7.4 or higher with curl enabled.
- A Google Cloud API Key with YouTube Data API v3 enabled.

### 2. Environment Configuration

This project uses a .env file for security. Do not commit your actual .env file to GitHub.

1. Create a file named .env in the root directory.
2. Add your API key in this format:
   YT_API_KEY=your_actual_api_key_here

### 3. File Permissions

The web server must have Write Access to the project folder so it can generate the yt_api_cache.json file.

- Folder permissions: 755 is usually sufficient.
- If the cache file isn't created, your API quota will be exhausted quickly.

### 4. Production Hardening

Once the site is live and confirmed working, open yt_api_worker.php and uncomment the hardening lines to hide system paths.

### 5. API Key Security (Production Only)

To prevent unauthorized use of your API quota:

1. Go to Google Cloud Console > Credentials.
2. Edit your API Key and set "Application restrictions" to **Websites**.
3. Add your specific domain (e.g., `https://yourdomain.com/*`).
4. Set "API restrictions" to specifically allow only the **YouTube Data API v3**.

## Project Structure

- yt_api_worker.php: The backend engine. Handles fetching, sorting, and image proxying.
- env_loader.php: A secure helper script to parse the .env file safely.
- yt_api_cache.json: (Auto-generated) Stores the sorted playlist data.
- .gitignore: Ensures sensitive keys and temporary cache stay off GitHub.
