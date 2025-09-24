# Twitch Stream Scraper for "Rust Kingdom"

This Node.js script uses Selenium WebDriver to scrape Twitch's Rust category page, extract stream titles and viewer counts containing "Rust Kingdom" (non-case-sensitive), sort them by viewer count in descending order, and allow the user to select a stream to click via a numbered prompt. The viewer counts are displayed in red text in the terminal.

## Features
- Navigates to `https://www.twitch.tv/directory/category/rust`.
- Scrapes stream titles and viewer counts for streams containing "Rust Kingdom" (case-insensitive).
- Sorts streams by viewer count in descending order (e.g., 3.8K > 1.2K).
- Displays viewer counts in red text using ANSI color codes.
- Prompts the user to select a stream by number using a readline interface.
- Clicks the selected stream's preview link to navigate to its page.
- Handles errors gracefully and ensures proper cleanup of resources.

## Prerequisites
- **Node.js**: Install Node.js (v14 or higher recommended) from [nodejs.org](https://nodejs.org/).
- **Chrome Browser**: Ensure Google Chrome is installed.
- **ChromeDriver**: Selenium requires ChromeDriver, which must match your Chrome version. It’s automatically managed if you use `webdriver-manager`.
- **Dependencies**: Install required Node.js packages (see Installation).

## Installation
1. **Clone or Create the Project**:
   - Create a project directory and save the script as `index.js` (or clone the repository if hosted).
   - Initialize a Node.js project:
     ```bash
     npm init -y
     ```

2. **Install Dependencies**:
   - Install `selenium-webdriver`:
     ```bash
     npm install selenium-webdriver
     ```
   - Optionally, install `webdriver-manager` to manage ChromeDriver:
     ```bash
     npm install -g webdriver-manager
     webdriver-manager update
     ```

3. **Verify ChromeDriver**:
   - Ensure ChromeDriver is installed and matches your Chrome browser version. Check your Chrome version in `Settings > About Chrome`. If `webdriver-manager` is not used, download ChromeDriver manually from [chromedriver.chromium.org](https://chromedriver.chromium.org/) and add it to your system PATH.

## Usage
1. **Run the Script**:
   - Save the script as `index.js` and run it with Node.js:
     ```bash
     node index.js
     ```

2. **Script Behavior**:
   - The script opens Chrome and navigates to `https://www.twitch.tv/directory/category/rust`.
   - It scrolls once to load more streams (Twitch uses infinite scroll).
   - It collects streams with "Rust Kingdom" in the title, sorts them by viewer count (descending), and displays them with numbered options (viewer counts in red).
   - Example output:
     ```
     Streams with "Rust Kingdom" in title (non-case-sensitive):
     ----------------------------------------------
     1. Title: [Exclusive Drop] [God POV] Rust Kingdoms 3: Desolation Day 5, Viewers: 3.8K viewers
     2. Title: Rust Kingdom Event, Viewers: 1.2K viewers
     ----------------------------------------------
     Enter the number of the stream to click (or press Enter to exit):
     ```
   - Enter a number (e.g., `1`) to click the corresponding stream’s link, or press Enter to exit.
   - The script waits 3 seconds after clicking to allow observation, then closes the browser.

3. **Exiting**:
   - If no streams are found, an invalid number is entered, or Enter is pressed, the script exits gracefully.
   - The browser and readline interface are closed automatically.

## Code Overview
- **Selenium WebDriver**: Used to automate Chrome browser interactions.
- **Readline**: Provides a command-line interface for user input.
- **Selectors**:
  - Stream cards: `article`
  - Titles: `h4[title]`
  - Viewer counts: `div[class*="ScMediaCardStatWrapper"]`
  - Stream links: `a[data-a-target="preview-card-image-link"]`
- **Sorting**: Viewer counts (e.g., "3.8K viewers") are parsed into numbers (e.g., 3800) for descending order sorting.
- **Error Handling**: Skips invalid stream cards, handles invalid user input, and ensures cleanup.

## Notes
- **Twitch’s Dynamic Classes**: Twitch uses obfuscated class names (e.g., `ScMediaCardStatWrapper-sc-anph5i-0`). If the script fails, inspect the page source (`Ctrl+Shift+I` in Chrome) to update selectors.
- **Infinite Scroll**: The script scrolls once to load more streams. To capture more streams, modify the script to loop the scroll action (e.g., 3-5 times).
- **Terminal Colors**: Red text for viewer counts (`\x1b[31m`) requires a terminal supporting ANSI colors (e.g., VS Code’s integrated terminal, Windows Terminal, or most Linux/macOS terminals).
- **Performance**: Adjust the `15000ms` wait or `2000ms` scroll delay based on network speed.
- **Date**: Tested as of September 24, 2025, 11:57 AM PDT. Twitch’s HTML structure may change, requiring selector updates.

## Troubleshooting
- **ChromeDriver Errors**: Ensure ChromeDriver matches your Chrome version. Run `webdriver-manager update` or download the correct version manually.
- **No Streams Found**: Check if "Rust Kingdom" streams are live or increase the scroll iterations.
- **Selector Errors**: If elements aren’t found, verify selectors using Chrome DevTools.
- **Terminal Color Issues**: If red text doesn’t display, try a different terminal or remove the ANSI codes (`\x1b[31m` and `\x1b[0m`).

## License
This project is unlicensed and provided as-is for educational purposes. Use responsibly and respect Twitch’s terms of service.
