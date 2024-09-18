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
  } catch (err) {
    console.error('Error fetching audio qualities:', err.message);
    return 'Unavailable';
  }
}

// Function to scrape video info and transcript
async function scrapeVideoInfo(videoUrl) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Go to the YouTube video URL
    await page.goto(videoUrl);

    // Fetch the video title
    const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent();
    const title = videoTitle.trim();

    // Fetch the view count
    let viewCount = 'Unavailable';
    try {
      viewCount = await page.locator('span.view-count').textContent();
      viewCount = viewCount.trim();
    } catch (err) {
      console.error("Failed to fetch view count:", err.message);
    }

    // Fetch the like count
    let likeCount = 'Unavailable';
    try {
      const likeButton = await page.getByRole('button', { name: /like this video along with/ });
      const likeCountAriaLabel = await likeButton.getAttribute('aria-label');
      const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
      likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';
    } catch (err) {
      console.error("Failed to fetch like count:", err.message);
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
    } catch (err) {
      console.error("Failed to fetch available resolutions:", err.message);
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
        ['Arabic', 'Chinese (Taiwan)', 'Dutch', 'English', 'Finnish', 'French', 'German', 'Greek', 'Hebrew', 
         'Hungarian', 'Italian', 'Japanese', 'Persian', 'Polish', 'Portuguese (Brazil)', 'Portuguese (Portugal)', 
         'Romanian', 'Russian', 'Serbian', 'Slovak', 'Spanish', 'Spanish (Spain)', 'Swedish', 'Thai', 'Turkish', 
         'Ukrainian', 'Vietnamese'].includes(subtitle)
      ).map(subtitle => {
        const code = getLanguageCode(subtitle);
        return `Language: ${subtitle}, Code: ${code}`;
      });

      subtitles = filteredSubtitles.join('\n') || 'No subtitles available';
    } catch (err) {
      console.error('Error fetching subtitles:', err.message);
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

  } catch (err) {
    console.error('Error fetching video info:', err.message);
  } finally {
    await browser.close();
  }
}

// Function to prompt user for input
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

// Start the prompt
promptForUrl();
