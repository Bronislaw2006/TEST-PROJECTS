const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

// Function to scrape video info and subtitles
async function scrapeVideoInfo(videoUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

    // Fetch the video title
    const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent();
    const title = videoTitle ? videoTitle.trim() : 'Title not found';

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

    // Output the basic video information first
    console.log(`Title: ${title}`);
    console.log(`Views: ${viewCount}`);
    console.log(`Like count: ${likeCount}`);

    // Fetch subtitles (if available)
    let subtitles = 'No subtitles available';
    try {
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click();
      await page.waitForTimeout(1000); // Wait for the menu to appear

      // Click on 'Subtitles/CC' to open the options
      await page.getByText('Subtitles/CC').click();
      await page.waitForTimeout(1000); // Wait for the menu to load

      // Dynamically fetch available subtitle languages
      const subtitleOptions = await page.$$eval('.ytp-panel-menu .ytp-menuitem-label', options =>
        options
          .map(option => option.textContent.trim())
          .filter(text => text !== 'Off' && !text.includes('Subtitles/CC')) // Filter out 'Off' and non-language items
          .concat(['English', 'English (auto-generated)'])  // Explicitly add English and auto-generated English if available
      );

      // If subtitles are found, join them in the string
      if (subtitleOptions.length > 0) {
        subtitles = subtitleOptions.join('\n');
      }
    } catch (err) {
      subtitles = 'No subtitles available';
    }

    console.log(`Available Subtitles: ${subtitles}`);

    // Optionally, save subtitles to a file
    fs.writeFileSync('subtitles.txt', subtitles, 'utf-8');
    console.log('Subtitles saved to subtitles.txt');

    // Pause the video after fetching subtitles
    await page.locator('video').click();
    await page.waitForTimeout(500); // Wait a bit for the video to pause

    // Fetch video quality using Playwright locators
    let availableQualities = [];
    try {
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click();
      await page.waitForTimeout(1000); // Wait for the settings menu to load

      // Click on 'Quality' to open the resolution options
      await page.getByText('Quality').click();
      await page.waitForTimeout(1000); // Wait for the menu to load

      // Fetch available video qualities
      availableQualities = await page.$$eval('.ytp-menuitem-label', options =>
        options.map(option => option.textContent.trim()).filter(Boolean)
      );
    } catch (err) {
      console.log('Error fetching video qualities from UI:', err);
    }

    if (availableQualities.length > 0) {
      console.log(`Available Video Qualities: ${availableQualities.join(', ')}`);
    } else {
      console.log('No video qualities found.');
    }

    // Fetch and save transcript
    let transcript = 'Transcript not found';
    try {
      await page.getByRole('button', { name: '...more' }).click();
      await page.getByRole('button', { name: 'Show transcript' }).click();
      await page.waitForSelector('ytd-transcript-segment-list-renderer', { timeout: 60000 });

      const transcriptSegments = await page.$$eval('ytd-transcript-segment-list-renderer', elements =>
        elements.map(el => el.textContent.trim()).filter(Boolean)
      );

      transcript = transcriptSegments.join('\n');
      // Save transcript to a file
      fs.writeFileSync('transcript.txt', transcript, 'utf-8');
      console.log('Transcript saved to transcript.txt');
    } catch (err) {
      console.log('Transcript not found:', err);
    }

  } catch (err) {
    console.error('Error scraping video info:', err);
  } finally {
    await browser.close();
  }
}

// Start the scraping process
(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter YouTube video URL: ', async (videoUrl) => {
    await scrapeVideoInfo(videoUrl);
    rl.close();
  });
})();

