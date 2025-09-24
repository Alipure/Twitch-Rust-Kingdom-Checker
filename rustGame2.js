const { Builder, By, until } = require('selenium-webdriver');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt user for input
const promptUser = (question) => new Promise((resolve) => {
    console.log(`Prompting user: ${question}`);
    rl.question(question, (answer) => {
        console.log(`User input: ${answer}`);
        resolve(answer);
    });
});

// Parse viewer count for sorting
function parseViewerCount(viewers) {
    console.log(`Parsing viewer count: ${viewers}`);
    const numStr = viewers.replace(/ viewers| watching/, '').trim();
    let viewerCount;
    if (numStr.endsWith('K')) {
        viewerCount = parseFloat(numStr.replace('K', '')) * 1000;
    } else if (numStr.endsWith('M')) {
        viewerCount = parseFloat(numStr.replace('M', '')) * 1000000;
    } else {
        viewerCount = parseInt(numStr) || 0;
    }
    console.log(`Parsed viewer count: ${viewerCount}`);
    return viewerCount;
}

// Scroll to bottom of page with forced iterations
async function scrollToBottom(driver) {
    console.log('Starting scroll to bottom');
    const maxScrolls = 5; // Force up to 5 scrolls
    for (let i = 0; i < maxScrolls; i++) {
        const height = await driver.executeScript('return document.body.scrollHeight');
        console.log(`Scroll ${i + 1}, page height: ${height}`);
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await driver.sleep(3000); // Wait for content to load
    }
    console.log('Finished scrolling');
}

(async function main() {
    console.log('Starting script');
    const driver = await new Builder().forBrowser('chrome').build();
    console.log('WebDriver initialized');
    
    try {
        const allStreams = []; // All streams for printing
        const twitchRustKingdomResults = []; // Twitch "Rust Kingdom" streams
        const twitchRustKingdomCardElements = []; // Cards for Twitch streams
        const kickRustKingdomResults = []; // Kick "Rust Kingdom" streams
        const kickRustKingdomCardElements = []; // Cards for Kick streams
        console.log('Initialized data structures');

        // --- Twitch Data Collection ---
        console.log('Navigating to Twitch Rust category');
        await driver.get('https://www.twitch.tv/directory/category/rust');
        await driver.manage().window().maximize();
        console.log('Waiting for Twitch stream cards');
        await driver.wait(until.elementsLocated(By.css('article')), 15000);
        console.log('Twitch stream cards located');
        await scrollToBottom(driver);

        console.log('Collecting Twitch stream cards');
        const twitchStreamCards = await driver.findElements(By.css('article'));
        console.log(`Found ${twitchStreamCards.length} Twitch stream cards`);

        for (let i = 0; i < twitchStreamCards.length; i++) {
            const card = twitchStreamCards[i];
            console.log(`Processing Twitch card ${i + 1}`);
            try {
                const titleElement = await card.findElement(By.css('h4[title]'));
                const title = await titleElement.getAttribute('title');
                const viewerElement = await card.findElement(By.css('div[class*="ScMediaCardStatWrapper"]'));
                const viewers = await viewerElement.getText();
                const viewerCount = parseViewerCount(viewers);
                console.log(`Twitch card: ${title}, ${viewers}`);

                allStreams.push({ platform: 'Twitch', title, viewers, viewerCount });

                if (title.toLowerCase().includes('rust kingdom')) {
                    console.log('Found Twitch "Rust Kingdom" stream');
                    twitchRustKingdomResults.push({ platform: 'Twitch', title, viewers, viewerCount });
                    twitchRustKingdomCardElements.push({ card, linkSelector: 'a[data-a-target="preview-card-image-link"]' });
                }
            } catch (e) {
                console.log(`Error processing Twitch card ${i + 1}: ${e.message}`);
            }
        }
        console.log(`Processed Twitch cards. Rust Kingdom matches: ${twitchRustKingdomResults.length}`);

        // Prompt user to select Twitch stream
        console.log('Printing Twitch "Rust Kingdom" streams:');
        console.log('----------------------------------------------');
        if (twitchRustKingdomResults.length === 0) {
            console.log('No Twitch "Rust Kingdom" streams found.');
        } else {
            twitchRustKingdomResults.sort((a, b) => b.viewerCount - a.viewerCount);
            twitchRustKingdomResults.forEach((stream, index) => {
                console.log(`${index + 1}. Platform: ${stream.platform}, Title: ${stream.title}, Viewers: \x1b[31m${stream.viewers}\x1b[0m`);
            });
            console.log('----------------------------------------------');

            const twitchChoice = await promptUser('Enter the number of the Twitch "Rust Kingdom" stream to click (or press Enter to proceed to Kick): ');
            const twitchChoiceNum = parseInt(twitchChoice);
            if (!isNaN(twitchChoiceNum) && twitchChoiceNum >= 1 && twitchChoiceNum <= twitchRustKingdomResults.length) {
                const selectedStream = twitchRustKingdomResults[twitchChoiceNum - 1];
                const { card, linkSelector } = twitchRustKingdomCardElements[twitchChoiceNum - 1];
                console.log(`Clicking Twitch stream: ${selectedStream.title}`);
                const streamLink = await card.findElement(By.css(linkSelector));
                await streamLink.click();
                await driver.sleep(3000);
                console.log('Clicked Twitch stream');
            }
        }

        // --- Kick Data Collection ---
        console.log('Opening new tab for Kick Rust category');
        await driver.executeScript('window.open();');
        const windows = await driver.getAllWindowHandles();
        await driver.switchTo().window(windows[windows.length - 1]);
        console.log('Navigating to Kick Rust category');
        await driver.get('https://kick.com/categories/rust');

        console.log('Waiting for Kick stream cards');
        await driver.wait(until.elementsLocated(By.css('img[src*="video_thumbnails"]')), 15000);
        console.log('Kick stream cards located');

        try {
            const acceptButton = await driver.findElement(By.css('button[data-testid="accept-cookies"]'));
            console.log('Cookie consent button found, clicking');
            await acceptButton.click();
            await driver.sleep(2000);
            console.log('Cookie consent dialog closed');
        } catch (e) {
            console.log('No cookie consent button found');
        }

        await scrollToBottom(driver);

        console.log('Collecting Kick stream cards');
        const kickImageElements = await driver.findElements(By.css('img[src*="video_thumbnails"]'));
        console.log(`Found ${kickImageElements.length} Kick image elements`);

        const processedTitles = new Set();
        for (let i = 0; i < kickImageElements.length; i++) {
            const imgElement = kickImageElements[i];
            console.log(`Processing Kick card ${i + 1}`);
            try {
                const title = await imgElement.getAttribute('alt');
                console.log(`Kick card title: ${title}`);

                if (!title.toLowerCase().includes('rust kingdom') || !title.toLowerCase().includes('rust kingdoms') || title.toLowerCase().includes('kingdom rusts') || title.toLowerCase().includes('kingdoms rust')) {
                    console.log(`Skipping Kick card ${i + 1}: Title does not contain "Rust Kingdom" or "Rust Kingdoms"`);
                    continue;
                }

                if (processedTitles.has(title)) {
                    console.log(`Skipping Kick card ${i + 1}: Duplicate title`);
                    continue;
                }
                processedTitles.add(title);

                const card = await imgElement.findElement(By.xpath('ancestor::div[contains(@class, "stream-card") or contains(@class, "card")]'));
                const viewerElements = await card.findElements(By.css('div.z-controls span[title]'));
                if (viewerElements.length === 0) {
                    console.log(`Skipping Kick card ${i + 1}: No viewer count`);
                    continue;
                }
                const viewers = await viewerElements[0].getText() + ' watching';
                const viewerCount = parseViewerCount(viewers);
                console.log(`Kick card viewers: ${viewers}`);

                const linkElements = await card.findElements(By.css('a'));
                let streamLink = null;
                console.log('Available hrefs:');
                for (const link of linkElements) {
                    const href = await link.getAttribute('href');
                    console.log(`- ${href}`);
                    if (href.startsWith('https://kick.com/') && !href.includes('/video/') && !href.includes('/categories/') && !href.includes('/clips/')) {
                        streamLink = link;
                        break;
                    }
                }
                if (!streamLink) {
                    console.log(`Skipping Kick card ${i + 1}: No valid stream link`);
                    continue;
                }

                console.log('Found Kick "Rust Kingdom" stream');
                allStreams.push({ platform: 'Kick', title, viewers, viewerCount });
                kickRustKingdomResults.push({ platform: 'Kick', title, viewers, viewerCount });
                kickRustKingdomCardElements.push({ card, linkSelector: 'a' });
                console.log(`Added Kick stream: ${title}, ${viewers}`);
            } catch (e) {
                console.log(`Error processing Kick card ${i + 1}: ${e.message}`);
            }
        }
        console.log(`Processed Kick cards. Rust Kingdom matches: ${kickRustKingdomResults.length}`);

        // Print all streams (Twitch + Kick)
        console.log('Sorting all streams by viewer count');
        allStreams.sort((a, b) => b.viewerCount - a.viewerCount);
        console.log('Printing all streams:');
        console.log('----------------------------------------------');
        if (allStreams.length === 0) {
            console.log('No streams found.');
        } else {
            allStreams.forEach((stream, index) => {
                console.log(`${index + 1}. Platform: ${stream.platform}, Title: ${stream.title}, Viewers: \x1b[31m${stream.viewers}\x1b[0m`);
            });
        }
        console.log('----------------------------------------------');

        // Prompt user to select Kick stream
        console.log('Printing Kick "Rust Kingdom" streams:');
        console.log('----------------------------------------------');
        if (kickRustKingdomResults.length === 0) {
            console.log('No Kick "Rust Kingdom" streams found.');
        } else {
            kickRustKingdomResults.sort((a, b) => b.viewerCount - a.viewerCount);
            kickRustKingdomResults.forEach((stream, index) => {
                console.log(`${index + 1}. Platform: ${stream.platform}, Title: ${stream.title}, Viewers: \x1b[31m${stream.viewers}\x1b[0m`);
            });
            console.log('----------------------------------------------');

            const kickChoice = await promptUser('Enter the number of the Kick "Rust Kingdom" stream to click (or press Enter to exit): ');
            const kickChoiceNum = parseInt(kickChoice);
            if (!isNaN(kickChoiceNum) && kickChoiceNum >= 1 && kickChoiceNum <= kickRustKingdomResults.length) {
                const selectedStream = kickRustKingdomResults[kickChoiceNum - 1];
                const { card, linkSelector } = kickRustKingdomCardElements[kickChoiceNum - 1];
                console.log(`Clicking Kick stream: ${selectedStream.title}`);
                const streamLinks = await card.findElements(By.css(linkSelector));
                let selectedLink = null;
                for (const link of streamLinks) {
                    const href = await link.getAttribute('href');
                    if (href.startsWith('https://kick.com/') && !href.includes('/video/') && !href.includes('/categories/') && !href.includes('/clips/')) {
                        selectedLink = link;
                        break;
                    }
                }
                if (selectedLink) {
                    await selectedLink.click();
                    await driver.sleep(3000);
                    console.log('Clicked Kick stream');
                } else {
                    console.log('No valid stream link for selected Kick stream');
                }
            } else {
                console.log('No Kick stream selected');
            }
        }

    } catch (e) {
        console.error(`Error: ${e.message}`);
    } finally {
        console.log('Closing readline interface');
        rl.close();
        console.log('Quitting WebDriver');
        await driver.quit();
        console.log('Script completed');
    }
})();
