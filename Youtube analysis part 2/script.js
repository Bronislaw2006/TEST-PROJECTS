const { chromium } = require('playwright'); // Import Playwright's Chromium module to control the browser.
const fs = require('fs'); // Import Node.js filesystem module to read and write files.
const readline = require('readline'); // Import readline module to create an interface for user input.

// Function to scrape video info and subtitles
async function scrapeVideoInfo(videoUrl) {
  const browser = await chromium.launch({ headless: true }); // Launch a headless browser instance.
  const page = await browser.newPage(); // Open a new page in the browser.

  try {
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' }); // Navigate to the provided YouTube video URL and wait for the content to load.

    // Fetch the video title
    const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent(); // Locate and extract the video title.
    const title = videoTitle ? videoTitle.trim() : 'Title not found'; // Trim whitespace and handle null cases.

    // Fetch the view count
    let viewCount = 'Unavailable';
    try {
      viewCount = await page.locator('span.view-count').textContent(); // Locate and extract the view count.
      viewCount = viewCount.trim(); // Trim whitespace.
    } catch {
      viewCount = 'Unavailable'; // Fallback in case the view count is not found.
    }

    // Fetch the like count
    let likeCount = 'Unavailable';
    try {
      const likeButton = await page.getByRole('button', { name: /like this video along with/ }); // Locate the button with a partial matching label.
      const likeCountAriaLabel = await likeButton.getAttribute('aria-label'); // Get the aria-label attribute for like count.
      const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/); // Extract the numerical value using regex.
      likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found'; // Format the like count and remove commas.
    } catch {
      likeCount = 'Unavailable'; // Fallback in case the like count is not found.
    }

    // Output the basic video information first
    console.log(`Title: ${title}`); // Print the video title.
    console.log(`Views: ${viewCount}`); // Print the view count.
    console.log(`Like count: ${likeCount}`); // Print the like count.

    // Fetch subtitles (if available)
    let subtitles = 'No subtitles available';
    try {
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click(); // Click the settings icon in the video player.
      await page.waitForTimeout(1000); // Wait for the settings menu to appear.

      // Click on 'Subtitles/CC' to open the options
      await page.getByText('Subtitles/CC').click(); // Open the subtitles menu.
      await page.waitForTimeout(1000); // Wait for the menu to load.

      // Dynamically fetch available subtitle languages
      const subtitleOptions = await page.$$eval('.ytp-panel-menu .ytp-menuitem-label', options =>
        options
          .map(option => option.textContent.trim()) // Extract and trim text content.
          .filter(text => text !== 'Off' && !text.includes('Subtitles/CC')) // Exclude 'Off' and non-language options.
          .concat(['English', 'English (auto-generated)'])  // Add explicit options for English if available.
      );

      // If subtitles are found, join them in the string
      if (subtitleOptions.length > 0) {
        subtitles = subtitleOptions.join('\n'); // Join available subtitles into a formatted string.
      }
    } catch (err) {
      subtitles = 'No subtitles available'; // Fallback in case subtitles are not found.
    }

    console.log(`Available Subtitles: ${subtitles}`); // Print the available subtitles.

    // Optionally, save subtitles to a file
    fs.writeFileSync('subtitles.txt', subtitles, 'utf-8'); // Save the subtitles to a text file.
    console.log('Subtitles saved to subtitles.txt'); // Confirm that subtitles were saved.

    // Pause the video after fetching subtitles
    await page.locator('video').click(); // Click on the video to pause it.
    await page.waitForTimeout(500); // Wait a moment to ensure the video is paused.

    // Fetch video quality using Playwright locators
    let availableQualities = [];
    try {
      await page.getByLabel('YouTube Video Player').getByLabel('Settings').click(); // Open the settings menu again.
      await page.waitForTimeout(1000); // Wait for the settings menu to load.

      // Click on 'Quality' to open the resolution options
      await page.getByText('Quality').click(); // Open the quality menu.
      await page.waitForTimeout(1000); // Wait for the menu to load.

      // Fetch available video qualities
      availableQualities = await page.$$eval('.ytp-menuitem-label', options =>
        options.map(option => option.textContent.trim()).filter(Boolean) // Extract and filter non-empty options.
      );
    } catch (err) {
      console.log('Error fetching video qualities from UI:', err); // Log any errors related to quality fetching.
    }

    if (availableQualities.length > 0) {
      console.log(`Available Video Qualities: ${availableQualities.join(', ')}`); // Print available video qualities.
    } else {
      console.log('No video qualities found.'); // Print fallback if no qualities are found.
    }

    // Fetch and save transcript
    let transcript = 'Transcript not found';
    try {
      await page.getByRole('button', { name: '...more' }).click(); // Click the 'More' button.
      await page.getByRole('button', { name: 'Show transcript' }).click(); // Click the 'Show transcript' button.
      await page.waitForSelector('ytd-transcript-segment-list-renderer', { timeout: 60000 }); // Wait for the transcript panel to load.

      const transcriptSegments = await page.$$eval('ytd-transcript-segment-list-renderer', elements =>
        elements.map(el => el.textContent.trim()).filter(Boolean) // Extract and trim transcript segments.
      );

      transcript = transcriptSegments.join('\n'); // Join transcript segments into a formatted string.
      // Save transcript to a file
      fs.writeFileSync('transcript.txt', transcript, 'utf-8'); // Write the transcript to a text file.
      console.log('Transcript saved to transcript.txt'); // Confirm the transcript was saved.
    } catch (err) {
      console.log('Transcript not found:', err); // Log any errors related to transcript fetching.
    }

  } catch (err) {
    console.error('Error scraping video info:', err); // Log any general errors.
  } finally {
    await browser.close(); // Close the browser after scraping.
  }
}

// Start the scraping process
(async () => {
  const rl = readline.createInterface({
    input: process.stdin, // Set up input from the standard input.
    output: process.stdout // Set up output to the standard output.
  });

  rl.question('Enter YouTube video URL: ', async (videoUrl) => {
    await scrapeVideoInfo(videoUrl); // Call the scraping function with user input.
    rl.close(); // Close the readline interface after completion.
  });
})(); // Immediately invoke the async function.


