const { chromium } = require('playwright');

(async () => {
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to YouTube video
    const videoURL = 'https://www.youtube.com/watch?v=Hfejyq5nrvE';
    await page.goto(videoURL);

    // Wait for the title to load and get the title
    const videoTitle = await page.locator('ytd-video-primary-info-renderer h1.title').innerText();


    console.log('Video Title:', videoTitle);

    // Close browser
    await browser.close();
})();





