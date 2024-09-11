const { chromium } = require('playwright');
const ytdl = require('yt-dlp-exec');

(async () => {
  // Define the YouTube video URL
  const videoUrl = 'https://www.youtube.com/watch?v=Hfejyq5nrvE';  // Replace with actual video URL

  // Function to fetch audio qualities using yt-dlp
  async function fetchAudioQualities() {
    try {
      const output = await ytdl(videoUrl, {
        listFormats: true  // List all available formats
      });

      // Split the output into lines
      const lines = output.split('\n');

      // Filter lines that contain audio formats by checking for "audio only"
      const audioFormats = lines.filter(line => line.includes('audio only'));

      // Create a Set to store unique bitrates in kbps
      const audioQualities = new Set();

      // Process each audio format to extract bitrate
      audioFormats.forEach(format => {
        const bitrateMatch = format.match(/(\d+)k/);
        if (bitrateMatch) {
          audioQualities.add(`${bitrateMatch[1]} kbps`);
        }
      });

      // Convert the Set to an array and return the bitrates
      return [...audioQualities].join(', ');
    } catch (err) {
      console.error('Error fetching audio qualities:', err.message);
      return 'Unavailable';
    }
  }

  // Function to scrape video info using Playwright
  async function scrapeVideoInfo() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
      await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

      // Wait for the body to load
      await page.waitForSelector('body', { timeout: 60000 });

      // Fetch the video title
      const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent({ timeout: 60000 });
      const title = videoTitle.trim();

      // Wait for a few seconds to allow dynamic elements (like views) to load
      await page.waitForTimeout(5000);

      // Fetch the view count
      let viewCount;
      try {
        viewCount = await page.locator('span.view-count').textContent({ timeout: 60000 });
        viewCount = viewCount.trim();
      } catch (err) {
        console.error("Failed to fetch view count:", err.message);
        viewCount = 'Unavailable';
      }

      // Fetch the like count
      let likeCount;
      try {
        await page.getByRole('button', { name: /like this video along with/ }, { timeout: 60000 });

        const likeButton = await page.getByRole('button', { name: /like this video along with/ });
        const likeCountAriaLabel = await likeButton.getAttribute('aria-label');
        const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
        likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';
      } catch (err) {
        console.error("Failed to fetch like count:", err.message);
        likeCount = 'Unavailable';
      }

      // Fetch available video resolutions
      let resolutions;
      try {
        // Pause the video
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
        resolutions = 'Unavailable';
      }

      // Output the information
      console.log(`Title: ${title}`);
      console.log(`Views: ${viewCount}`);
      console.log(`Like count: ${likeCount}`);
      console.log(`Available Resolutions: ${resolutions}`);
      
      // Fetch and output audio qualities
      const audioQualities = await fetchAudioQualities();
      console.log(`Available Audio Qualities: ${audioQualities}`);

    } finally {
      await browser.close();
    }
  }

  // Call the function to scrape video info and fetch audio qualities
  await scrapeVideoInfo();

})();






























// const { chromium } = require('playwright');

// (async () => {
//   // Launch the browser (headless for faster execution, change to false for debugging)
//   const browser = await chromium.launch({ headless: false });
//   const page = await browser.newPage();

//   // Define the YouTube video URL
//   const videoUrl = 'https://www.youtube.com/watch?v=8S0FDjFBj8o';  // Replace with actual video URL

//   // Navigate to the YouTube video page
//   await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

//   // Wait for the body to load
//   await page.waitForSelector('body', { timeout: 60000 });

//   // Fetch the video title
//   const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent({ timeout: 60000 });
//   console.log(`Title: ${videoTitle.trim()}`);

//   // Wait for a few seconds to allow dynamic elements (like views) to load
//   await page.waitForTimeout(5000);

//   // Fetch the view count using an alternative approach
//   let viewCount;
//   try {
//     viewCount = await page.locator('span.view-count').textContent({ timeout: 60000 });
//     console.log(`Views: ${viewCount.trim()}`);
//   } catch (err) {
//     console.error("Failed to fetch view count:", err.message);
//   }

//   // Fetch the like count by interacting with the like button
//   try {
//     await page.getByRole('button', { name: /like this video along with/ }, { timeout: 60000 });

//     // Find the like button and extract the aria-label
//     const likeButton = await page.getByRole('button', { name: /like this video along with/ });
//     const likeCountAriaLabel = await likeButton.getAttribute('aria-label');

//     // Extract numeric like count from the aria-label
//     const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
//     const likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';

//     // Print the like count to the console
//     console.log('Like count:', likeCount);
//   } catch (err) {
//     console.error("Failed to fetch like count:", err.message);
//   }

//   // Fetch the available video resolutions
//   try {
//     // Ensure the video is paused before interacting with the player controls
//     await page.click('video');  // Click on the video to pause it

//     // Click on the settings (gear) icon in the player
//     await page.click('button.ytp-settings-button');

//     // Wait for the settings menu to appear
//     await page.waitForSelector('.ytp-panel-menu', { timeout: 10000 });

//     // Click on the "Quality" option
//     const qualityOption = await page.locator('.ytp-menuitem:has-text("Quality")');
//     await qualityOption.click();

//     // Wait for the quality menu to appear
//     await page.waitForSelector('.ytp-quality-menu', { timeout: 10000 });

//     // Fetch all available resolution options
//     const resolutionOptions = await page.$$eval('.ytp-quality-menu .ytp-menuitem', options =>
//       options.map(option => option.textContent.trim())
//     );

//     // Print available resolutions
//     console.log('Available Resolutions:', resolutionOptions);
//   } catch (err) {
//     console.error("Failed to fetch available resolutions:", err.message);
//   }

//   // Close the browser
//   await browser.close();
// })();















































// const { chromium } = require('playwright');

// (async () => {
//   // Start the browser (headless for faster execution, change to 'false' for debugging)
//   const browser = await chromium.launch({ headless: false });
//   const page = await browser.newPage();

//   // Define the YouTube video URL
//   const videoUrl = 'https://www.youtube.com/watch?v=8S0FDjFBj8o';  // Replace with actual video URL

//   // Navigate to the YouTube video page
//   await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });

//   // Wait for the body to load
//   await page.waitForSelector('body', { timeout: 60000 });

//   // Fetch the video title
//   const videoTitle = await page.locator('h1.title.style-scope.ytd-video-primary-info-renderer').textContent({ timeout: 60000 });
//   console.log(`Title: ${videoTitle.trim()}`);

//   // Wait for a few seconds to allow dynamic elements (like views) to load
//   await page.waitForTimeout(5000);

//   // Fetch the view count using an alternative approach
//   let viewCount;
//   try {
//     viewCount = await page.locator('span.view-count').textContent({ timeout: 60000 });
//     console.log(`Views: ${viewCount.trim()}`);
//   } catch (err) {
//     console.error("Failed to fetch view count:", err.message);
//   }

//   // Wait for the like button to be visible
//   try {
//     await page.getByRole('button', { name: /like this video along with/ }, { timeout: 60000 });

//     // Find the like button and extract the aria-label
//     const likeButton = await page.getByRole('button', { name: /like this video along with/ });
//     const likeCountAriaLabel = await likeButton.getAttribute('aria-label');

//     // Extract numeric like count from the aria-label
//     const likeCountMatch = likeCountAriaLabel.match(/(\d+(?:,\d+)*)/);
//     const likeCount = likeCountMatch ? likeCountMatch[1].replace(/,/g, '') : 'Not found';

//     // Print the like count to the console
//     console.log('Like count:', likeCount);
//   } catch (err) {
//     console.error("Failed to fetch like count:", err.message);
//   }

//   // Close the browser
//   await browser.close();
// })();














































