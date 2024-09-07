const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const url = "https://www.instagram.com/";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  let browser;
  console.log(process.env.USERNAME);
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    // Login
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', process.env.USERNAME1);
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', process.env.PASSWORD);
    await wait(2000);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Handle potential "Save Login Info" popup
    try {
      await page.waitForSelector('div[role="button"][tabindex="0"]', { timeout: 5000 });
      await page.click('div[role="button"][tabindex="0"]');
    } catch (error) {
      console.log("'Save Login Info' popup not found, continuing...");
    }

    // Handle potential "Turn on Notifications" popup
    try {
      await page.waitForSelector('button._a9--', { timeout: 5000 });
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button._a9--');
        for (const button of buttons) {
          if (button.textContent.includes("Not Now")) {
            button.click();
            break;
          }
        }
      });
    } catch (error) {
      console.log("'Turn on Notifications' popup not found, continuing...");
    }


    // Navigate to the chat section
    await page.goto("https://www.instagram.com/direct/inbox/", { waitUntil: "networkidle2" });
    console.log("Navigated to the chat section");
    await wait(1000);
    // Wait for the chat list to load
    await page.waitForSelector('div[role="listitem"]', { timeout: 30000 });

    // Extract usernames of the top 3 recent chats
    const recentChats = await page.evaluate(() => {
      const chatItems = document.querySelectorAll('div[role="listitem"]');
      return Array.from(chatItems).slice(0, 5).map(item => {
        const usernameElement = item.querySelector('span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv.xuxw1ft');
        return usernameElement ? usernameElement.textContent.trim() : 'Unknown';
      });
    });


    console.log("Top 3 recent chat usernames:");
    recentChats.forEach((username, index) => {
      console.log(`${index + 1}. ${username}`);
    });

  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

main();