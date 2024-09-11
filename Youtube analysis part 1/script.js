const ytdl = require('ytdl-core');
const axios = require('axios');
const fs = require('fs');
const { getTranscript } = require('youtube-transcript');
const { getSubtitles } = require('youtube-captions-scraper');

// Add your YouTube Data API Key here
const apiKey = 'AIzaSyA39xhFbLRR4qvKz2XBL-UUWBaSWT0pzsk'; // Replace with your API key

// Validate if the input is a valid YouTube link
function validateYouTubeLink(link) {
    return ytdl.validateURL(link);
}

// Get video metadata from YouTube API
async function getVideoMetadata(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        const videoDetails = response.data.items[0];
        return videoDetails;
    } catch (error) {
        console.error('Error fetching video metadata:', error);
        return null;
    }
}

// Get available resolutions and audio qualities (including adaptive formats)
async function getVideoInfo(link) {
    try {
        const info = await ytdl.getInfo(link);
        // Get all video formats (audio+video and video-only)
        const videoFormats = ytdl.filterFormats(info.formats, 'video');
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        // Get unique resolutions from video formats
        const videoResolutions = [...new Set(videoFormats.map(f => f.qualityLabel))];

        // Get audio qualities from audio-only formats
        const audioQualities = [...new Set(audioFormats.map(a => a.audioBitrate + ' kbps'))];

        const lengthSeconds = info.videoDetails.lengthSeconds;
        const videoId = info.videoDetails.videoId;

        return { videoResolutions, audioQualities, lengthSeconds, videoId };
    } catch (error) {
        console.error('Error fetching video info:', error);
        return null;
    }
}

// Get the list of available subtitles using `getAvailableSubtitles` from ytdl-core
async function getSubtitleList(videoId) {
    try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        const subtitles = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!subtitles || subtitles.length === 0) {
            console.log('No subtitles available for this video.');
            return [];
        }

        console.log('\nAvailable Subtitles:');
        subtitles.forEach((subtitle, index) => {
            console.log(`${index + 1}. Language: ${subtitle.name.simpleText}, Code: ${subtitle.languageCode}`);
        });

        return subtitles;
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        return [];
    }
}

// Get transcript if available and save it to a file
async function getTranscriptText(videoId) {
    try {
        const transcript = await getSubtitles({
            videoID: videoId,
            lang: 'en' // You can change this to the language code of the available subtitles
        });
        const transcriptText = transcript.map(item => item.text).join(' ');
        fs.writeFileSync('transcript.txt', transcriptText);
        console.log('Transcript saved to transcript.txt');
        return true;
    } catch (error) {
        console.error('Transcript not available:', error.message);
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

    // Fetching metadata (title, views, likes)
    const metadata = await getVideoMetadata(videoId);
    if (!metadata) return;

    const title = metadata.snippet.title;  // Fetching the video title
    const views = metadata.statistics.viewCount;
    const likes = metadata.statistics.likeCount || 'Likes disabled';

    // List available subtitles
    const subtitles = await getSubtitleList(videoId);

    // Fetching transcript if available
    const transcriptAvailable = await getTranscriptText(videoId);

    // Fetching subtitles status
    const subtitlesStatus = metadata.contentDetails.caption === 'true' ? 'Available' : 'Not Available';

    // Organize output
    console.log('\n===== Video Information =====');
    console.log(`Title: ${title}`);  // Title first
    console.log(`Video Length: ${lengthSeconds} seconds`);
    console.log(`Views: ${views}`);
    console.log(`Likes: ${likes}`);
    console.log(`Available Resolutions: ${videoResolutions.join(', ')}`);
    console.log(`Available Audio Qualities: ${audioQualities.join(', ')}`);
    console.log(`Subtitles: ${subtitlesStatus}`);
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



// const ytdl = require('ytdl-core');
// const axios = require('axios');
// const fs = require('fs');
// const { getTranscript } = require('youtube-transcript'); // Ensure this is correctly installed
// const { getSubtitles } = require('youtube-captions-scraper');

// // Add your YouTube Data API Key here
// const apiKey = 'AIzaSyA39xhFbLRR4qvKz2XBL-UUWBaSWT0pzsk'; // Replace with your API key

// // Validate if the input is a valid YouTube link
// function validateYouTubeLink(link) {
//     return ytdl.validateURL(link);
// }

// // Get video metadata from YouTube API
// async function getVideoMetadata(videoId) {
//     const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,contentDetails&key=${apiKey}`;
//     try {
//         const response = await axios.get(url);
//         const videoDetails = response.data.items[0];
//         return videoDetails;
//     } catch (error) {
//         console.error('Error fetching video metadata:', error);
//         return null;
//     }
// }

// // Get available resolutions and audio qualities (including adaptive formats)
// async function getVideoInfo(link) {
//     try {
//         const info = await ytdl.getInfo(link);
//         // Get all video formats (audio+video and video-only)
//         const videoFormats = ytdl.filterFormats(info.formats, 'video');
//         const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

//         // Get unique resolutions from video formats
//         const videoResolutions = [...new Set(videoFormats.map(f => f.qualityLabel))];

//         // Get audio qualities from audio-only formats
//         const audioQualities = [...new Set(audioFormats.map(a => a.audioBitrate + ' kbps'))];

//         const lengthSeconds = info.videoDetails.lengthSeconds;
//         const videoId = info.videoDetails.videoId;

//         return { videoResolutions, audioQualities, lengthSeconds, videoId };
//     } catch (error) {
//         console.error('Error fetching video info:', error);
//         return null;
//     }
// }

// // Get the list of available subtitles using `getAvailableSubtitles` from ytdl-core
// async function getSubtitleList(videoId) {
//     try {
//         const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
//         const subtitles = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

//         if (!subtitles || subtitles.length === 0) {
//             console.log('No subtitles available for this video.');
//             return [];
//         }

//         console.log('\nAvailable Subtitles:');
//         subtitles.forEach((subtitle, index) => {
//             console.log(`${index + 1}. Language: ${subtitle.name.simpleText}, Code: ${subtitle.languageCode}`);
//         });

//         return subtitles;
//     } catch (error) {
//         console.error('Error fetching subtitles:', error);
//         return [];
//     }
// }

// // Get transcript if available and save it to a file
// async function getTranscriptText(videoId) {
//     try {
//         const transcript = await getSubtitles({
//             videoID: videoId,
//             lang: 'en' // You can change this to the language code of the available subtitles
//         });
//         const transcriptText = transcript.map(item => item.text).join(' ');
//         fs.writeFileSync('transcript.txt', transcriptText);
//         console.log('Transcript saved to transcript.txt');
//         return true;
//     } catch (error) {
//         console.error('Transcript not available:', error.message);
//         return false;
//     }
// }

// // Main function to gather and display all information
// async function fetchYouTubeData(link) {
//     if (!validateYouTubeLink(link)) {
//         console.log('Invalid YouTube link');
//         return;
//     }

//     const videoInfo = await getVideoInfo(link);
//     if (!videoInfo) return;

//     const { videoResolutions, audioQualities, lengthSeconds, videoId } = videoInfo;

//     // Fetching metadata (views, likes)
//     const metadata = await getVideoMetadata(videoId);
//     if (!metadata) return;
    
//     const views = metadata.statistics.viewCount;
//     const likes = metadata.statistics.likeCount || 'Likes disabled';

//     // List available subtitles
//     const subtitles = await getSubtitleList(videoId);

//     // Fetching transcript if available
//     const transcriptAvailable = await getTranscriptText(videoId);

//     // Fetching subtitles status
//     const subtitlesStatus = metadata.contentDetails.caption === 'true' ? 'Available' : 'Not Available';

//     // Organize output
//     console.log('\n===== Video Information =====');
//     console.log(`Video Length: ${lengthSeconds} seconds`);
//     console.log(`Views: ${views}`);
//     console.log(`Likes: ${likes}`);
//     console.log(`Available Resolutions: ${videoResolutions.join(', ')}`);
//     console.log(`Available Audio Qualities: ${audioQualities.join(', ')}`);
//     console.log(`Subtitles: ${subtitlesStatus}`);
//     console.log(`Transcript Available: ${transcriptAvailable ? 'Yes (saved to transcript.txt)' : 'No'}`);
// }

// // Get the YouTube link from terminal input (process.argv)
// const youtubeLink = process.argv[2]; // Get the second argument (index 2)

// if (!youtubeLink) {
//     console.log("Please provide a YouTube link.");
//     process.exit(1);
// }

// // Call the main function with the provided YouTube link
// fetchYouTubeData(youtubeLink);


