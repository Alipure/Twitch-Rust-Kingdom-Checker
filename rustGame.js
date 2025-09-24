const { Builder, By, until } = require('selenium-webdriver');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
const promptUser = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        // Navigate to Twitch Rust category
        await driver.get('https://www.twitch.tv/directory/category/rust');
        await driver.manage().window().maximize();

        // Wait for stream cards to load
        await driver.wait(until.elementsLocated(By.css('article')), 15000);

        // Scroll to load more streams
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await driver.sleep(2000); // Wait for additional streams to load

        // Get all stream cards
        let streamCards = await driver.findElements(By.css('article'));
        let results = [];
        let cardElements = []; // Store card elements for clicking

        // Collect streams with "Rust Kingdom" in title
        for (let card of streamCards) {
            try {
                let titleElement = await card.findElement(By.css('h4[title]'));
                let title = await titleElement.getAttribute('title');
                if (title.toLowerCase().includes('rust kingdom')) {
                    let viewerElement = await card.findElement(By.css('div[class*="ScMediaCardStatWrapper"]'));
                    let viewers = await viewerElement.getText();
                    let viewerCount = parseViewerCount(viewers);
                    results.push({ title, viewers, viewerCount });
                    cardElements.push(card); // Store the card for later clicking
                }
            } catch (e) {
                continue; // Skip cards that fail to parse
            }
        }

        // Sort results by viewer count in descending order
        results.sort((a, b) => b.viewerCount - a.viewerCount);

        // Print results with numbered options
        console.log('Streams with "Rust Kingdom" in title (non-case-sensitive):');
        console.log('----------------------------------------------');
        if (results.length === 0) {
            console.log('No streams found with "Rust Kingdom" in title.');
            return;
        }

        results.forEach((stream, index) => {
            // Display viewer count in red
            console.log(`${index + 1}. Title: ${stream.title}, Viewers: \x1b[31m${stream.viewers}\x1b[0m`);
        });

        console.log('----------------------------------------------');

        // Prompt user to select a stream
        const choice = await promptUser('Enter the number of the stream to click (or press Enter to exit): ');

        // Handle user input with switch case
        const choiceNum = parseInt(choice);
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > results.length) {
            console.log('Invalid selection or no selection made. Exiting.');
            return;
        }

        // Use switch case to select and click the stream
        switch (choiceNum) {
            case choiceNum:
                if (cardElements[choiceNum - 1]) {
                    let streamLink = await cardElements[choiceNum - 1].findElement(By.css('a[data-a-target="preview-card-image-link"]'));
                    await streamLink.click();
                    console.log(`Clicked stream: ${results[choiceNum - 1].title}`);
                    await driver.sleep(3000); // Wait to observe the click action
                } else {
                    console.log('Error: Selected stream card not found.');
                }
                break;
            default:
                console.log('No valid stream selected.');
                break;
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        rl.close();
        // await driver.quit(); // Ensure browser closes
    }
})();

// Helper function to parse viewer count for sorting
function parseViewerCount(viewers) {
    // Remove " viewers" from string
    let numStr = viewers.replace(' viewers', '').trim();
    // Handle K (thousands) and M (millions)
    if (numStr.endsWith('K')) {
        return parseFloat(numStr.replace('K', '')) * 1000;
    } else if (numStr.endsWith('M')) {
        return parseFloat(numStr.replace('M', '')) * 1000000;
    } else {
        return parseInt(numStr) || 0;
    }
}
