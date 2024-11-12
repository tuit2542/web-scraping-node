const puppeteer = require('puppeteer');
const fs = require('fs');
const { Parser } = require('json2csv');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env')});
const { extractSubstring } = require('./utils/ex-substring.js');

async function scrapper() {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    //URL Web
    await page.goto(process.env.URL_FRUIT);
    //Selector MoreButton 
    const moreDataSelector = process.env.MORE_SELECTOR;
    //Selector container list of data
    const containerSelector = process.env.CONTAINER_SELECTOR;

    //Array for add data
    var toCsvArr = [];

    //Declare max value for loop output
    let MAX = 0;

    //MoreButton check condition if can click return data
    const isClickable = await page.$eval(moreDataSelector, async el => {
        const style = window.getComputedStyle(el);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
    });

    //Fetch all data until MoreButton cannot click 
    while (isClickable) {
        try {
            //Set max value
            MAX = await page.$$eval(containerSelector, containers => containers.length);

            //Click more data
            await page.click(moreDataSelector);
        } catch (e) {
            break;
        }
    }
    //Set max value last time 
    MAX = await page.$$eval(containerSelector, containers => containers.length);

    //Looping for data 
    for (let i = 1; i <= MAX; i++) {
        //Data first column 
        //SELECTOR example : #__next > div.features-products-search.search-query- > div:nth-child(3) > div:nth-child(2) > div.result-conteners > div:nth-child(${i}) > a > divdiv.productName
        let elementProductName = await page.waitForSelector(`#__next > div.features-products-search.search-query- > div:nth-child(3) > div:nth-child(2) > div > div > div > div.result-conteners > div:nth-child(${i}) > a > div > div > div > div > div.detail-product-grid > div.productName`, { timeout: 60000 });
        let productName = await page.evaluate(elementProductName => elementProductName.textContent, elementProductName);
        //Data second column
        let elementProductPrice = await page.waitForSelector(`#__next > div.features-products-search.search-query- > div:nth-child(3) > div:nth-child(2) > div > div > div > div.result-conteners > div:nth-child(${i}) > a > div > div > div > div > div.priceDetail > div > div.price-detail > div.price-infrom`, { timeout: 60000 });
        let productPriceStr = await page.evaluate(elementProductPrice => elementProductPrice.textContent, elementProductPrice);

        //Data third column
        let productPrice = productPriceStr.replace(/[^\d\s-]/g, '').trim();

        //Data fourth column
        let productQuantity = extractSubstring(productPriceStr);


        let json_obj = {
            "No": i,
            "Name": productName,
            "Price": productPrice,
            "Quantity": productQuantity
        };

        //Add JSON object to array
        toCsvArr.push(json_obj);
    }

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(toCsvArr);

    // Generate filename with DateTime
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const filename = `fruit_taladthai_${timestamp}.csv`;

    // Write CSV to file
    fs.writeFileSync(`${process.env.PATH_OUTPUT}/${filename}`, csv);
    console.log('amount : '+MAX);
    console.log('CSV file created successfully.');

    await browser.close();
}
scrapper(); 