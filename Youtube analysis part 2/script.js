const { chromium } = require('playwright');
const fs = require('fs');
const ytdl = require('yt-dlp-exec');
const readline = require('readline');

// Function to get the ISO language code from the language name
function getLanguageCode(language) {
  const codeMap = {
    'Arabic': 'ar', 'Chinese (Taiwan)': 'zh-TW', 'Dutch': 'nl', 'English': 'en', 'English (auto-generated)': 'en',
    'Finnish': 'fi', 'French': 'fr', 'German': 'de', 'Greek': 'el', 'Hebrew': 'iw', 'Hungarian': 'hu', 'Italian': 'it',
    'Japanese': 'ja', 'Persian': 'fa', 'Polish': 'pl', 'Portuguese (Brazil)': 'pt-BR', 'Portuguese (Portugal)': 'pt-PT',
    'Romanian': 'ro', 'Russian': 'ru', 'Serbian': 'sr', 'Slovak': 'sk', 'Spanish': 'es', 'Spanish (Spain)': 'es-ES',
    'Swedish': 'sv', 'Thai': 'th', 'Turkish': 'tr', 'Ukrainian': 'uk', 'Vietnamese': 'vi',
  };
  return codeMap[language] || 'N/A';
}

// Function to fetch audio qualities using yt-dlp
async function fetchAudioQualities(videoUrl) {
  try {
    const output = await ytdl(videoUrl, { listFormats: true });
    const lines = output.split('\n');
    const audioFormats = lines.filter(line => line.includes('audio only'));

    const audioQualities = new Set();
    audioFormats.forEach(format => {
      const bitrateMatch = format.match(/(\d+)k/);
      if (bitrateMatch) {
        audioQualities.add(`${bitrateMatch[1]} kbps`);
      }
    });

    return [...audioQualities].join(', ');
  } catch {
    return 'Unavailable'; // Suppress the error and return a default value
  }
}

// Function to scrape video info and transcript
async function scrapeVideoInfo(videoUrl) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(videoUrl);

    // Fetch the video title
    const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent();
    const title = videoTitle.trim();

    // Fetch the view count
    let viewCount = 'Unavailable';
    try {
      viewCount = await page.locator('span.view-count').textContent();
      viewCount = viewCount.trim();
    } catch {
      viewCount = 'Unavailable'; // Handle quietly if fetching view count fails
    }

    // Fetch the like count
    let likeCount = 'Unavailable';
    try {
      const likeButton = await page.getByRole('button', { name: /like this video along with/ });
      const likeCountAriaLabel = await likeButton.getAttribute('aria-label');
      const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
      likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';
    } catch {
      likeCount = 'Unavailable'; // Handle quietly if fetching like count fails
    }

    // Fetch available video resolutions
    let resolutions = 'Unavailable';
    try {
      await page.click('video');
      await page.click('button.ytp-settings-button');
      await page.waitForSelector('.ytp-panel-menu', { timeout: 10000 });
      const qualityOption = await page.locator('.ytp-menuitem:has-text("Quality")');
      await qualityOption.click();
      await page.waitForSelector('.ytp-quality-menu', { timeout: 10000 });
      const resolutionOptions = await page.$$eval('.ytp-quality-menu .ytp-menuitem', options =>
        options.map(option => option.textContent.trim())
      );
      resolutions = resolutionOptions.join(', ');
    } catch {
      resolutions = 'Unavailable'; // Handle quietly if fetching resolutions fails
    }

    // Fetch available subtitles
    let subtitles = 'No subtitles available';
    try {
      await page.click('video');
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click();
      await page.getByRole('menuitem', { name: 'Subtitles/CC' }).click();
      await page.waitForSelector('.ytp-panel-menu', { timeout: 10000 });
      const subtitleOptions = await page.$$eval('.ytp-panel-menu .ytp-menuitem-label', options =>
        options.map(option => option.textContent.trim())
      );

      const filteredSubtitles = subtitleOptions.filter(subtitle =>
        ['Arabic', 'Chinese (Taiwan)', 'Dutch', 'English', 'English (auto-generated)', 'Finnish', 'French', 'German', 'Greek', 'Hebrew',
          'Hungarian', 'Italian', 'Japanese', 'Persian', 'Polish', 'Portuguese (Brazil)', 'Portuguese (Portugal)',
          'Romanian', 'Russian', 'Serbian', 'Slovak', 'Spanish', 'Spanish (Spain)', 'Swedish', 'Thai', 'Turkish',
          'Ukrainian', 'Vietnamese'].includes(subtitle)
      ).map(subtitle => {
        const code = getLanguageCode(subtitle);
        return `Language: ${subtitle}, Code: ${code}`;
      });

      subtitles = filteredSubtitles.join('\n') || 'No subtitles available';
    } catch {
      subtitles = 'No subtitles available'; // Handle quietly if fetching subtitles fails
    }

    // Output video information
    console.log(`Title: ${title}`);
    console.log(`Views: ${viewCount}`);
    console.log(`Like count: ${likeCount}`);
    console.log(`Available Resolutions: ${resolutions}`);
    console.log(`Available Subtitles:\n${subtitles}`);

    // Fetch and output audio qualities
    const audioQualities = await fetchAudioQualities(videoUrl);
    console.log(`Available Audio Qualities: ${audioQualities}`);

    // Save the transcript
    try {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.getByRole('button', { name: '...more' }).click();
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.getByRole('button', { name: 'Show transcript' }).click();
      await page.waitForSelector('ytd-transcript-segment-list-renderer', { timeout: 60000 });

      const transcriptSegments = await page.$$eval('ytd-transcript-segment-list-renderer', elements =>
        elements.map(el => el.innerText).join('\n')
      );

      if (transcriptSegments.length > 0) {
        fs.writeFileSync('transcript.txt', transcriptSegments);
        console.log('Transcript saved successfully.');
      } else {
        console.log('Transcript is empty.');
      }
    } catch {
      console.log('No transcript available.'); // Handle quietly if fetching transcript fails
    }

  } catch {
    console.log('Error fetching video info.'); // Generic error message to avoid details
  } finally {
    await browser.close();
  }
}

// Function to prompt user for input for the YouTube URL using the readline module
function promptForUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the YouTube video URL: ', async (url) => {
    await scrapeVideoInfo(url);
    rl.close();
  });
}

// Start the input prompt by calling the promptForUrl function
promptForUrl();


// const { chromium } = require('playwright'); // Import playwright's chromium browser for web automation.
// const fs = require('fs'); // Import node's file system module to handle file operations.
// const ytdl = require('yt-dlp-exec'); // Import the 'yt-dlp' module for downloading and fetching video/audio formats.
// const readline = require('readline'); // Import the readline module to handle the input in the terminal.

// // Function to get the ISO language code from the language name
// function getLanguageCode(language) {
//   const codeMap = {
//     'Arabic': 'ar', 'Chinese (Taiwan)': 'zh-TW', 'Dutch': 'nl', 'English': 'en', 'English (auto-generated)': 'en',
//     'Finnish': 'fi', 'French': 'fr', 'German': 'de', 'Greek': 'el', 'Hebrew': 'iw', 'Hungarian': 'hu', 'Italian': 'it',
//     'Japanese': 'ja', 'Persian': 'fa', 'Polish': 'pl', 'Portuguese (Brazil)': 'pt-BR', 'Portuguese (Portugal)': 'pt-PT',
//     'Romanian': 'ro', 'Russian': 'ru', 'Serbian': 'sr', 'Slovak': 'sk', 'Spanish': 'es', 'Spanish (Spain)': 'es-ES',
//     'Swedish': 'sv', 'Thai': 'th', 'Turkish': 'tr', 'Ukrainian': 'uk', 'Vietnamese': 'vi',
//   }; // A map of supported languages and their corresponding ISO codes.
//   return codeMap[language] || 'N/A'; // Return the matching language code, or 'N/A' if not found.
// }

// // Function to fetch audio qualities using yt-dlp
// async function fetchAudioQualities(videoUrl) {
//   try {
//     const output = await ytdl(videoUrl, { listFormats: true }); // Use yt-dlp to list the available formats for the video url.

//     const lines = output.split('\n'); // Split the output into two lines.
//     const audioFormats = lines.filter(line => line.includes('audio only')); // Filter lines containing 'audio only' for audio formats.

//     const audioQualities = new Set(); // Create a set to store unique audio qualities.
//     audioFormats.forEach(format => {
//       const bitrateMatch = format.match(/(\d+)k/); // Extract the bitrates in kbps using regex.
//       if (bitrateMatch) {
//         audioQualities.add(`${bitrateMatch[1]} kbps`); // Add the extracted bitrate to the Set.
//       }
//     });

//     return [...audioQualities].join(', '); // Return the unique audio qualites as a comma-separated string.
//   } catch (err) {
//     console.error('Error fetching audio qualities:', err.message); // Handle and log any errors.
//     return 'Unavailable'; // Return 'Unavialable' if an error occurs.
//   }
// }

// // Function to scrape video info and transcript
// async function scrapeVideoInfo(videoUrl) {
//   const browser = await chromium.launch({ headless: false }); // Launch the chromium browser in non-headless mode.
//   const page = await browser.newPage(); // Open a new page in the browser.

//   try {
//     // Go to the YouTube video URL
//     await page.goto(videoUrl);

//     // Fetch the video title
//     const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent();
//     const title = videoTitle.trim(); // Trim any extra whitespace from the title. 

//     // Fetch the view count
//     let viewCount = 'Unavailable'; // Initialize the view count with a default value
//     try {
//       viewCount = await page.locator('span.view-count').textContent(); // get the view count.
//       viewCount = viewCount.trim(); // Trim extra whitespace from the view count.
//     } catch (err) {
//       console.error("Failed to fetch view count:", err.message); // log an error if fetching the view count fails.
//     }

//     // Fetch the like count
//     let likeCount = 'Unavailable'; // Initialize the view count with a default value.
//     try {
//       const likeButton = await page.getByRole('button', { name: /like this video along with/ }); // Locate the link button.
//       const likeCountAriaLabel = await likeButton.getAttribute('aria-label'); // Get the arial-label attribute for the like count.
//       const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/); // Extract the like count using regex.
//       likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found'; // Format the like count or set it to 'Not found' if unavailable. 
//     } catch (err) {
//       console.error("Failed to fetch like count:", err.message); // log an error if fetching the like count fails.
//     }

//     // Fetch available video resolutions
//     let resolutions = 'Unavailable'; // Initialize the resolution list with a default value.
//     try {
//       await page.click('video'); // Click on the video player to focus.
//       await page.click('button.ytp-settings-button'); // Click the settings button on the video player.
//       await page.waitForSelector('.ytp-panel-menu', { timeout: 10000 }); // Wait for the settings menu to appear.
//       const qualityOption = await page.locator('.ytp-menuitem:has-text("Quality")'); // Locate the 'Quality' option.
//       await qualityOption.click(); // click the 'Quality' options
//       await page.waitForSelector('.ytp-quality-menu', { timeout: 10000 }); // Wait for the quality menu to appear.
//       const resolutionOptions = await page.$$eval('.ytp-quality-menu .ytp-menuitem', options =>
//         options.map(option => option.textContent.trim())
//       ); // Extract and trim the available resolution options.
//       resolutions = resolutionOptions.join(', '); // Join the resolutions into a comma-separated stings.
//     } catch (err) {
//       console.error("Failed to fetch available resolutions:", err.message); // Log an error if fetching resolutions fails.
//     }

//     // Fetch available subtitles
// let subtitles = 'No subtitles available'; // Initialize the subtitle list with a default value.
// try {
//   await page.click('video'); // Click on the video player to focus.
//   await page.getByLabel('YouTube Video Player').getByLabel('Settings').click(); // Open the settings menu in the video player.
//   await page.getByRole('menuitem', { name: 'Subtitles/CC' }).click(); // Click on the subtitle/CC option.
//   await page.waitForSelector('.ytp-panel-menu', { timeout: 10000 }); // Wait for the subtitles menu to appear.
//   const subtitleOptions = await page.$$eval('.ytp-panel-menu .ytp-menuitem-label', options =>
//     options.map(option => option.textContent.trim())
//   ); // Extract and trim the available subtitle options.

//   const filteredSubtitles = subtitleOptions.filter(subtitle =>
//     ['Arabic', 'Chinese (Taiwan)', 'Dutch', 'English', 'English (auto-generated)', 'Finnish', 'French', 'German', 'Greek', 'Hebrew', 
//      'Hungarian', 'Italian', 'Japanese', 'Persian', 'Polish', 'Portuguese (Brazil)', 'Portuguese (Portugal)', 
//      'Romanian', 'Russian', 'Serbian', 'Slovak', 'Spanish', 'Spanish (Spain)', 'Swedish', 'Thai', 'Turkish', 
//      'Ukrainian', 'Vietnamese'].includes(subtitle)
//   ).map(subtitle => {
//     const code = getLanguageCode(subtitle); // Fetch the ISO code for the subtitle language.
//     return `Language: ${subtitle}, Code: ${code}`; // Return the formatted subtitle language and code.
//   });

//   subtitles = filteredSubtitles.join('\n') || 'No subtitles available'; // Join the subtitles into a string or set a default value.
// } catch (err) {
//   console.error('Error fetching subtitles:', err.message); // Log an error if fetching subtitles fails.
// }


//     // Output video information
//     console.log(`Title: ${title}`); // Log the video title. 
//     console.log(`Views: ${viewCount}`); // Log the view count.
//     console.log(`Like count: ${likeCount}`); // Log the like count
//     console.log(`Available Resolutions: ${resolutions}`); // Log the available resolutions.
//     console.log(`Available Subtitles:\n${subtitles}`); // Log the available subtitles.

//     // Fetch and output audio qualities
//     const audioQualities = await fetchAudioQualities(videoUrl); // Fetch audio qualities using yt-dlp
//     console.log(`Available Audio Qualities: ${audioQualities}`); // Log the avialable audio qualities.

//     // Save the transcript
//     await page.evaluate(() => window.scrollBy(0, 500)); // Scroll down the page to load more content.
//     await page.getByRole('button', { name: '...more' }).click(); // Click the '...more' button.
//     await page.evaluate(() => window.scrollBy(0, 300)); // Scroll down again to access the transcript button.
//     await page.getByRole('button', { name: 'Show transcript' }).click(); // Click the 'show transcript' button.
//     await page.waitForSelector('ytd-transcript-segment-list-renderer', { timeout: 60000 }); // Wait for the transcript segments to be visible.
    
//     const transcriptSegments = await page.$$eval('ytd-transcript-segment-list-renderer', elements => 
//       elements.map(el => el.innerText).join('\n')
//     ); // Fetch the transcript segments by selecting the elements with the tag 'ytd-transcript-segment-list-renderer'
//        // and mapping each element's innerText . Then, join all the segments with a newline character ('\n').
    

//     // Check if there are any transcript segments.
//     if (transcriptSegments.length > 0) {
//       // If transcript segments exist, write them to a file names 'transcript.txt'
//       fs.writeFileSync('transcript.txt', transcriptSegments);
//       console.log('Transcript saved successfully.');
//     } else {
//       // If the transcript is empty. log a message to the console.  
//       console.log('Transcript is empty.');
//     }

//   } catch (err) {
//     // If an error occurs during the process, catch the error and log the message.
//     console.error('Error fetching video info:', err.message);
//   } finally {
//     // After everything thing is complete, whether successful or not, close the browser.
//     await browser.close();
//   }
// }

// // Function to prompt user for input for the youtube url using the readline module.
// function promptForUrl() {
//   // Create an interface to read input from the user via the console.
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
  
//   // Prompt the user to input the youtube video url.
//   rl.question('Enter the YouTube video URL: ', async (url) => {
//     // Pass the user input (youtube url) to the scrapeVideoInfo funtion and wait for it to complete.
//     await scrapeVideoInfo(url);
//     // Close the readline interface after processing the input.
//     rl.close();
//   });
// }

// // Start the input prompt by calling the promptForUrl function.
// promptForUrl();
