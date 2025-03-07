const puppeteer = require("puppeteer");
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputCsvFile = 'mos.csv'; // Your input CSV file
const outputCsvFile = 'output.csv';
const viewport_height = 742;
const MAX_RETRIES = 3;

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({
        headless: false, // Set to true if you don’t want to see the browser
        defaultViewport: {
            width: 393, // iPhone 16 viewport width
            height: 852, // iPhone 16 viewport height
            deviceScaleFactor: 3 // Retina display scaling factor
        },
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    // Open a new page
    const page = await browser.newPage();

    // Set user agent to simulate iPhone 16 Chrome browser
    await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36"
    );

    // Emulate iPhone 16 settings
    await page.emulate({
        userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
        viewport: {
            width: 393,
            height: 852,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        }
    });

    // Navigate to a URL

    // https://www.elle.com/jp/gourmet/gourmet-healthyfood/g42766857/worst-foods-for-teeth-23-0313/
    const url = "https://www.elle.com/jp/decor/decor-interior-design/g42749939/ellen-kavanaugh-sea-island-house-tour-230327/"; // Replace with your target URL
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("section[id^='slide-']", { timeout: 100000 });
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
    console.log(slideHeights)
})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300; // Scroll step size
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


