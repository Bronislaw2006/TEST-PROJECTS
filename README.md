# YouTube Video Data Fetcher

This script allows you to fetch and analyze various details about a YouTube video. It retrieves video metadata, available resolutions and audio qualities, subtitle information, and transcripts. This tool can be particularly useful for understanding video content and gathering related data programmatically.

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Requirements](#requirements)
4. [Setup](#setup)
5. [Usage](#usage)
6. [How It Works](#how-it-works)

## Introduction

The YouTube Video Data Fetcher is a Node.js script that uses various libraries to collect detailed information about a YouTube video. By providing a video link, users can retrieve metadata, available video and audio formats, subtitles, and transcripts. 

## Features

- **Video Metadata**: Fetches statistics like views and likes.
- **Video and Audio Quality**: Lists available video resolutions and audio qualities.
- **Subtitles**: Displays available subtitle languages and their codes.
- **Transcript**: Saves the video transcript to a file if available.

## Requirements

- Node.js (version 12 or higher recommended)
- `ytdl-core` library for fetching video information
- `axios` for making HTTP requests
- `fs` for file system operations
- `youtube-transcript` and `youtube-captions-scraper` for fetching subtitles and transcripts

## Setup

1. **Clone the Repository**: 
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**: 
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Add Your YouTube Data API Key**:
   Replace the placeholder API key in the script with your actual YouTube Data API key:
   ```javascript
   const apiKey = 'YOUR_API_KEY_HERE';
   ```

## Usage

1. **Run the Script**:
   To fetch data for a specific YouTube video, run the script with the video URL as an argument:
   ```bash
   node index.js "https://www.youtube.com/watch?v=VIDEO_ID"
   ```

2. **View Results**:
   The script will print various details about the video to the terminal and save the transcript to a file named `transcript.txt` if available.

## How It Works

1. **Validate YouTube Link**: The script first checks if the provided link is a valid YouTube URL using `ytdl-core`.
2. **Fetch Video Info**: Retrieves video details such as resolutions and audio qualities using `ytdl-core`.
3. **Fetch Metadata**: Uses YouTube Data API to get video statistics like views and likes.
4. **Get Subtitles**: Lists available subtitle languages and codes.
5. **Fetch Transcript**: Retrieves and saves the transcript to `transcript.txt` if available.



