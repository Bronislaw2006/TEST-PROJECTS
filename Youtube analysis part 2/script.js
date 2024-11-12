const { chromium } = require('playwright');
const fs = require('fs');
const ytdl = require('yt-dlp-exec');
const readline = require('readline');

// Function to fetch audio qualities using yt-dlp
// Function to fetch audio qualities using yt-dlp without downloading
async function fetchAudioQualities(videoUrl) {
  try {
    const output = await ytdl(videoUrl, {
      listFormats: true, // List formats instead of downloading
      dumpSingleJson: true, // Outputs data without downloading
    });
    const formats = output.formats.filter(format => format.acodec !== 'none' && format.vcodec === 'none');
    const audioQualities = formats.map(format => `${format.abr} kbps`).filter(Boolean);

    return [...new Set(audioQualities)].join(', ');
  } catch (error) {
    return 'Unavailable';
  }
}


// Function to scrape video info and transcript
async function scrapeVideoInfo(videoUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

    // Fetch the video title
    const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent();
    const title = videoTitle.trim();

    // Fetch the view count
    let viewCount = 'Unavailable';
    try {
      viewCount = await page.locator('span.view-count').textContent();
      viewCount = viewCount.trim();
    } catch {
      viewCount = 'Unavailable';
    }

    // Fetch the like count
    let likeCount = 'Unavailable';
    try {
      const likeButton = await page.getByRole('button', { name: /like this video along with/ });
      const likeCountAriaLabel = await likeButton.getAttribute('aria-label');
      const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
      likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';
    } catch {
      likeCount = 'Unavailable';
    }

    // Open subtitle menu and select subtitles
    let subtitles = 'No subtitles available';
    try {
      // Click on the settings button to open the menu
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click();
      await page.waitForTimeout(1000); // Wait for the menu to appear

      // Click on 'Subtitles/CC' to open the options
      await page.getByText('Subtitles/CC').click();
      await page.waitForTimeout(1000); // Wait for the menu to load

      // Dynamically fetch available subtitle languages
      const subtitleOptions = await page.$$eval('.ytp-panel-menu .ytp-menuitem-label', options =>
        options
          .map(option => option.textContent.trim())
          .filter(text => text !== 'Off' && !text.includes('Subtitles/CC'))
      );

      if (subtitleOptions.length > 0) {
        subtitles = subtitleOptions.join('\n');
      } else {
        subtitles = 'No subtitles available';
      }
    } catch (err) {
      subtitles = 'No subtitles available';
    }

    // Output video information
    console.log(`Title: ${title}`);
    console.log(`Views: ${viewCount}`);
    console.log(`Like count: ${likeCount}`);
    console.log(`Available Subtitles:\n${subtitles}`);

    // Fetch and output audio qualities
    const audioQualities = await fetchAudioQualities(videoUrl);
    console.log(`Available Audio Qualities: ${audioQualities}`);

    // Fetch the transcript using the updated locators
    try {
      await page.getByRole('button', { name: '...more' }).click();
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
      console.log('No transcript available.');
    }

  } catch {
    console.log('Error fetching video info.');
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

