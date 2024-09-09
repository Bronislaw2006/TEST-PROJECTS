                           **YouTube Video Info and Transcript Fetcher**


This Node.js script fetches YouTube video metadata, available resolutions, audio qualities, subtitles, and transcripts (if available). It uses the ytdl-core, axios, youtube-transcript, and youtube-captions-scraper libraries to collect and display video information.

**Features**

Validates the provided YouTube link.

Fetches video metadata (views, likes).

Lists available resolutions and audio qualities for video and audio streams.

Displays available subtitles and fetches the transcript.

Saves the transcript to a transcript.txt file.
<br>

**Requirements**
<br>

Node.js installed on your machine.<br>
YouTube Data API key.<br>
Installed dependencies (ytdl-core, axios, fs, youtube-transcript, youtube-captions-scraper).<br><br>

**Command to run the Program: node script.js "Place the youtube link you want fetch data off."**<br>

**Output:**

===== Video Information =====

Video Length: (example: 5152 seconds)

Views: (example: 473655)

Likes: (example: 27465)

Available Resolutions: (example: 360p, 720p)

Available Audio Qualities: (example: 160 kbps, 128 kbps)

Subtitles: Available

Transcript Available: Yes (saved to transcript.txt)
<br><br>

**Files**<br><br>
index.js: The main script that fetches and displays video information.<br>
package.json: Contains project metadata and dependencies.<br>
transcript.txt: If a transcript is available, it will be saved in this file.<br><br>
Author: Bronislaw Britto



