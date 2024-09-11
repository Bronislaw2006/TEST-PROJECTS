// tests/fetchTitle.spec.js

const { test, expect } = require('@playwright/test');

test('Fetch YouTube title', async ({ page }) => {
    // URL of the YouTube video
    const url = 'https://www.youtube.com/watch?v=Hfejyq5nrvE'; // Replace with actual video ID

    // Navigate to the YouTube video page
    await page.goto(url, { waitUntil: 'networkidle' });

    // Extract the video title
    const videoTitle = await page.evaluate(() => {
        const titleElement = document.querySelector('h1.title yt-formatted-string');
        return titleElement ? titleElement.textContent.trim() : 'Title not found';
    });

    // Print the video title to the terminal
    console.log(`Video Title: ${videoTitle}`);

    // Optional: Use Playwright’s assertion library to verify title
    expect(videoTitle).not.toBe('Title not found');
});





