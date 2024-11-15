# YouTube Video Info and Transcript Scraper

This project provides a Node.js script to scrape information from a YouTube video using playwright, including the video title, view count, like count, available resolutions, subtitles, and audio qualities. It also fetches and saves the video transcript to a text file.

## Features

- **Fetch Video Information:** Title, view count, like count, and available resolutions.
- **Extract Subtitles:** Lists available subtitles with language codes.
- **Save Transcript:** Extracts and saves the video transcript to a text file.

## Prerequisites

- Node.js (version 20.16.0 )
- `pnpm`

## Usage

1. **Run the Script:**

   ```bash
   node script.js
   ```

2. **Enter the YouTube Video URL:**

   When prompted, paste the YouTube video URL into the terminal and press `Enter`.

3. **View Results:**

   - The script will output video information, available resolutions, subtitles, and audio qualities to the console.
   - The transcript will be saved to a file named `transcript.txt` if available.

## Example Output

```
Enter the YouTube video URL: https://www.youtube.com/watch?v=Hfejyq5nrvE
Title: Example Video Title
Views: 1,234,567 views
Like count: 123,456
Available Resolutions: 144p, 240p, 360p, 480p, 720p, 1080p
Available Subtitles:
Language: English, Code: en
Language: Spanish, Code: es
Transcript saved successfully.
```

## Troubleshooting

- **Invalid URL Error:** Ensure that the URL provided is a valid YouTube video URL.
- **Network Issues:** Ensure you have a stable internet connection while running the script.
- **Dependencies Issues:** Verify that all dependencies are installed correctly.