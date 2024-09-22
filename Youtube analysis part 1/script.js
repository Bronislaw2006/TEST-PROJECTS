const ytdl = require('ytdl-core'); // Import ytdl-core for YouTube video information
const axios = require('axios'); // Import axios for making HTTP requests
const fs = require('fs'); // Import fs for file system operations
const { getTranscript } = require('youtube-transcript'); // Import youtube-transcript to fetch video transcripts
const { getSubtitles } = require('youtube-captions-scraper'); // Import youtube-captions-scraper for subtitles

// Add your YouTube Data API Key here (replace with an actual API key)
const apiKey = 'AIzaSyD_3BmY0J8wUV85OTvUMFr0fxWJ6UHlpe8'; 

// Function to validate if the input is a valid YouTube link
function validateYouTubeLink(link) {
    return ytdl.validateURL(link); // Use ytdl-core's URL validation
}

// Fetch video metadata from YouTube API using videoId
async function getVideoMetadata(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`;
    try {
        const response = await axios.get(url); // Make an API call to get video details
        const videoDetails = response.data.items[0]; // Extract video details
        return videoDetails;
    } catch (error) {
        console.error('Error fetching video metadata:', error); // Handle errors
        return null;
    }
}

// Fetch available video resolutions and audio qualities
async function getVideoInfo(link) {
    try {
        const info = await ytdl.getInfo(link); // Fetch video info using ytdl-core
        const videoFormats = ytdl.filterFormats(info.formats, 'video'); // Filter for video formats
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly'); // Filter for audio-only formats

        // Get unique video resolutions and audio bitrates
        const videoResolutions = [...new Set(videoFormats.map(f => f.qualityLabel))];
        const audioQualities = [...new Set(audioFormats.map(a => a.audioBitrate + ' kbps'))];

        const lengthSeconds = info.videoDetails.lengthSeconds; // Video length in seconds
        const videoId = info.videoDetails.videoId; // Extract video ID

        return { videoResolutions, audioQualities, lengthSeconds, videoId }; // Return video info
    } catch (error) {
        console.error('Error fetching video info:', error); // Handle errors
        return null;
    }
}

// Fetch the list of available subtitles for the video
async function getSubtitleList(videoId) {
    try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`); // Get video info
        const subtitles = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks; // Extract subtitle tracks

        if (!subtitles || subtitles.length === 0) { // Check if no subtitles are available
            console.log('No subtitles available for this video.');
            return [];
        }

        console.log('\nAvailable Subtitles:');
        subtitles.forEach((subtitle, index) => {
            console.log(`${index + 1}. Language: ${subtitle.name.simpleText}, Code: ${subtitle.languageCode}`); // Display available subtitles
        });

        return subtitles;
    } catch (error) {
        console.error('Error fetching subtitles:', error); // Handle errors
        return [];
    }
}

// Fetch transcript and save to file if available
async function getTranscriptText(videoId) {
    try {
        const transcript = await getSubtitles({ videoID: videoId, lang: 'en' }); // Get subtitles in English
        const transcriptText = transcript.map(item => item.text).join(' '); // Join all subtitle text
        fs.writeFileSync('transcript.txt', transcriptText); // Save transcript to file
        console.log('Transcript saved to transcript.txt');
        return true;
    } catch (error) {
        console.error('Transcript not available:', error.message); // Handle transcript errors
        return false;
    }
}

// Main function to gather video details and display them
async function fetchYouTubeData(link) {
    if (!validateYouTubeLink(link)) { // Validate the YouTube link
        console.log('Invalid YouTube link');
        return;
    }

    const videoInfo = await getVideoInfo(link); // Fetch video info
    if (!videoInfo) return; // Exit if no video info is found

    const { videoResolutions, audioQualities, lengthSeconds, videoId } = videoInfo; // Destructure video info

    const metadata = await getVideoMetadata(videoId); // Fetch metadata (title, views, likes)
    if (!metadata) return;

    const title = metadata.snippet.title; // Extract video title
    const views = metadata.statistics.viewCount; // Extract view count
    const likes = metadata.statistics.likeCount || 'Likes disabled'; // Extract like count or show 'Likes disabled'

    const subtitles = await getSubtitleList(videoId); // Fetch available subtitles
    const transcriptAvailable = await getTranscriptText(videoId); // Fetch and save transcript if available

    const subtitlesStatus = metadata.contentDetails.caption === 'true' ? 'Available' : 'Not Available'; // Check if subtitles are available

    // Display organized video information
    console.log('\n===== Video Information =====');
    console.log(`Title: ${title}`);
    console.log(`Video Length: ${lengthSeconds} seconds`);
    console.log(`Views: ${views}`);
    console.log(`Likes: ${likes}`);
    console.log(`Available Resolutions: ${videoResolutions.join(', ')}`);
    console.log(`Available Audio Qualities: ${audioQualities.join(', ')}`);
    console.log(`Subtitles: ${subtitlesStatus}`);
    console.log(`Transcript Available: ${transcriptAvailable ? 'Yes (saved to transcript.txt)' : 'No'}`);
}

// Get YouTube link from command-line input (process.argv)
const youtubeLink = process.argv[2]; // Get the second argument as YouTube link

if (!youtubeLink) {
    console.log("Please provide a YouTube link."); // If no link is provided, prompt the user
    process.exit(1); // Exit the process with error code 1
}

// Call the main function to fetch and display YouTube data
fetchYouTubeData(youtubeLink);

