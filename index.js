const ytdl = require('ytdl-core');
const axios = require('axios');
const fs = require('fs');
const { getTranscript } = require('youtube-transcript');

// Add your YouTube Data API Key here
const apiKey = 'AIzaSyA39xhFbLRR4qvKz2XBL-UUWBaSWT0pzsk'; // Replace with your API key

// Validate if the input is a valid YouTube link
function validateYouTubeLink(link) {
    const valid = ytdl.validateURL(link);
    return valid;
}

// Get video metadata from YouTube API
async function getVideoMetadata(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,contentDetails&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        const videoDetails = response.data.items[0];
        return videoDetails;
    } catch (error) {
        console.error('Error fetching video metadata:', error);
        return null;
    }
}

// Get available resolutions and audio qualities
async function getVideoInfo(link) {
    try {
        const info = await ytdl.getInfo(link);
        const formats = ytdl.filterFormats(info.formats, 'audioandvideo');
        const videoResolutions = [...new Set(formats.map(f => f.qualityLabel))];
        const audioOnly = ytdl.filterFormats(info.formats, 'audioonly');
        const audioQualities = [...new Set(audioOnly.map(a => a.audioBitrate + ' kbps'))];
        
        const lengthSeconds = info.videoDetails.lengthSeconds;
        const videoId = info.videoDetails.videoId;

        return { videoResolutions, audioQualities, lengthSeconds, videoId };
    } catch (error) {
        console.error('Error fetching video info:', error);
        return null;
    }
}

// Get transcript if available
async function getTranscriptText(videoId) {
    try {
        const transcript = await getTranscript(videoId);
        const transcriptText = transcript.map(item => item.text).join(' ');
        fs.writeFileSync('transcript.txt', transcriptText);
        return true;
    } catch (error) {
        console.error('Transcript not available:', error);
        return false;
    }
}

// Main function to gather and display all information
async function fetchYouTubeData(link) {
    if (!validateYouTubeLink(link)) {
        console.log('Invalid YouTube link');
        return;
    }

    const videoInfo = await getVideoInfo(link);
    if (!videoInfo) return;

    const { videoResolutions, audioQualities, lengthSeconds, videoId } = videoInfo;

    // Fetching metadata (views, likes)
    const metadata = await getVideoMetadata(videoId);
    const views = metadata.statistics.viewCount;
    const likes = metadata.statistics.likeCount || 'Likes disabled';

    // Fetching transcript if available
    const transcriptAvailable = await getTranscriptText(videoId);

    // Fetching subtitles
    const subtitles = metadata.contentDetails.caption === 'true' ? 'Available' : 'Not Available';

    // Organize output
    console.log('\n===== Video Information =====');
    console.log(`Video Length: ${lengthSeconds} seconds`);
    console.log(`Views: ${views}`);
    console.log(`Likes: ${likes}`);
    console.log(`Available Resolutions: ${videoResolutions.join(', ')}`);
    console.log(`Available Audio Qualities: ${audioQualities.join(', ')}`);
    console.log(`Subtitles: ${subtitles}`);
    console.log(`Transcript Available: ${transcriptAvailable ? 'Yes (saved to transcript.txt)' : 'No'}`);
}

// Get the YouTube link from terminal input (process.argv)
const youtubeLink = process.argv[2]; // Get the second argument (index 2)

if (!youtubeLink) {
    console.log("Please provide a YouTube link.");
    process.exit(1);
}

// Call the main function with the provided YouTube link
fetchYouTubeData(youtubeLink);  