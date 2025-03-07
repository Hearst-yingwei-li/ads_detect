const puppeteer = require("puppeteer");
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputCsvFile = 'mos.csv'; // Your input CSV file
const outputCsvFile = 'output.csv';
const viewport_height = 742;
const ADDS_OFF_HEIGHT = 72;// top&buttom margin 16+16=32, plus ads margin 40
const MAX_RETRIES = 3;

async function processUrls() {
    const results = [];
    // Read CSV file
    fs.createReadStream(inputCsvFile)
        .pipe(csv())
        .on('data', (row) => {
            results.push(row);
        })
        .on('end', async () => {
            console.log('CSV file successfully processed.');
            // Open a new page
            const browser = await puppeteer.launch({
                headless: false, // Set to true if you don’t want to see the browser
                defaultViewport: {
                    width: 393, // iPhone 16 viewport width
                    height: viewport_height, // iPhone 16 viewport height 852
                    deviceScaleFactor: 3 // Retina display scaling factor
                },
                protocolTimeout: 100000,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
            const page = await browser.newPage();
            try {
                await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36");
            } catch (error) {
                console.warn("User agent override failed, retrying...");
                await page.waitForTimeout(3000);
                await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36");
            }
            // Emulate iPhone 16 settings
            await page.emulate({
                userAgent:
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
                viewport: {
                    width: 393,
                    height: viewport_height, //852
                    deviceScaleFactor: 3,
                    isMobile: true,
                    hasTouch: true
                }
            });

            for (let row of results) {
                // for (let row of results.slice(2)) {
                console.log(`---- Processing article: ${row.id}, URL: ${row.url}`);
                // await new Promise(resolve => setTimeout(resolve, 3000));
                try {

                    try {
                        await safeGoto(page, row.url)
                    } catch (error) {
                        console.warn(`Failed to load ${url}`);
                        // throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // Set user agent to simulate iPhone 16 Chrome browser

                    /////////////
                    await autoScroll(page);
                    ////////////////////////////////////
                    await page.waitForSelector("section[id^='slide-']", { timeout: 20000 });
                    // const pageContent = await page.evaluate(() => document.body.innerHTML);
                    // console.log(pageContent); 

                    const slideHeights = await page.evaluate(() => {
                        // Select all <section> elements where id starts with "slide_"
                        const slideSections = document.querySelectorAll("section[id^='slide-']");
                        const sectionsArray = Array.from(slideSections);
                        let sectionsExceptLast = sectionsArray.slice();
                        if (slideSections.length > 1) {
                            sectionsExceptLast = sectionsArray.slice(0, -1);
                        }
                        // Convert NodeList to an array and map to get heights
                        return sectionsExceptLast.map(section => {
                            const contentDiv = section.querySelector("div > div");
                            const totalHeight = section.getBoundingClientRect().height;

                            const titleElement = contentDiv.querySelector("span"); // Title
                            const subtitleElement = contentDiv.querySelector("h2"); // Subtitle

                            let imageTotalHeight = null;
                            let nonImageTotalHeight = null;
                            // Check firstLayerDivs length before accessing elements
                            const firstLayerDivs = Array.from(contentDiv.children).filter(el => el.tagName === "DIV");
                            console.log(firstLayerDivs.length)
                            if (firstLayerDivs.length > 0) {
                                const firstDiv = firstLayerDivs[0];
                                const containsImage = firstDiv.querySelector("img") !== null; // Check if it has an <img> tag

                                const imageDivs = firstLayerDivs.filter(div => div.querySelector("img"));
                                const nonImageDivs = firstLayerDivs.filter(div => !div.querySelector("img"));
                                imageTotalHeight = imageDivs.reduce((sum, div) => sum + div.getBoundingClientRect().height, 0);
                                nonImageTotalHeight = nonImageDivs.reduce((sum, div) => sum + div.getBoundingClientRect().height, 0);
                            }
                            return {
                                id: section.id,
                                total: totalHeight,
                                span: titleElement ? titleElement.getBoundingClientRect().height : 0,
                                h2: subtitleElement ? subtitleElement.getBoundingClientRect().height : 0,
                                img: imageTotalHeight ? imageTotalHeight : 0,
                                description: nonImageTotalHeight ? nonImageTotalHeight : 0
                            };
                        });
                    });
                    const oversizedSections = slideHeights.filter(section => section.total < (viewport_height - ADDS_OFF_HEIGHT));

                    // Update row values
                    row.isShown = oversizedSections.length > 0 ? 1 : 0;
                    row.info = JSON.stringify(slideHeights);
                } catch (error) {
                    console.error(`Error processing ${row.url}: ${error.message}`);
                    row.isShown = 0;
                    row.info = '';
                }
                // Write updated data to a new CSV file
                const csvWriter = createCsvWriter({
                    path: outputCsvFile,
                    header: [
                        { id: 'id', title: 'id' },
                        { id: 'url', title: 'url' },
                        { id: 'isShown', title: 'isShown' },
                        { id: 'info', title: 'info' }
                    ]
                });
                await csvWriter.writeRecords(results);
                console.log(`Results saved to ${outputCsvFile}`);
            }

            await browser.close();
        });
}

processUrls();

// Function to scroll down automatically
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 700; // Scroll step size
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function safeGoto(page, url) {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });//networkidle2
            return; // Success, exit loop
        } catch (error) {
            console.warn(`Retry ${i + 1}/${MAX_RETRIES}: Failed to load ${url}`);
            if (i === MAX_RETRIES - 1) throw error; // Final attempt failed
        }
    }
}