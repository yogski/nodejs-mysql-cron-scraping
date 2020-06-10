const axios = require('axios').default;
const cheerio = require('cheerio');

const fetchHtml = async url => {
    try {
        //change axios to post later on
        const { data } = await axios.get(url);
        return data;
    } catch {
        console.error(`Error while fetching URL: ${url}`);
    }
};

//extract wanted properties here
const extractItem = selector => {
    const title = selector
        .find(".responsive_search_name_combined")
        .find("div[class='col search_name ellipsis'] > span[class='title']")
        .text()
        .trim();

    const releaseDate = selector
        .find(".responsive_search_name_combined")
        .find("div[class='col search_released responsive_secondrow']")
        .text()
        .trim();

    const link = selector.attr("href").trim();

    const originalPrice = selector
        .find("div[class='col search_price_discount_combined responsive_secondrow']")
        .find("div[class='col search_price discounted responsive_secondrow']")
        .text()
        .trim();

    const selectPrice = selector
    .find("div[class='col search_price_discount_combined responsive_secondrow']")
    .find("div[class='col search_price discounted responsive_secondrow']")
    .html()
    .trim();

    const matched = selectPrice.match(/(<br>(.+\s[0-9].+.\d+))/);

    const discountedPrice = matched[matched.length - 1];

    return { title, releaseDate, link, originalPrice, discountedPrice };
}

const scrapStream = async () => {
    const targetUrl = "https://store.steampowered.com/search/?filter=weeklongdeals";
    const html = await fetchHtml(targetUrl);
    const selector = cheerio.load(html);

    // Here we are telling cheerio that the "<a>" collection 
    //is inside a div with id 'search_resultsRows' and 
    //this div is inside other with id 'search_result_container'.
    //So,'searchResults' is an array of cheerio objects with "<a>" elements
    const searchResults = selector("body")
    .find("#search_result_container > #search_resultsRows > a");

    const items = searchResults
    .map((idx, el) => {
      const elementSelector = selector(el);
      return extractDeal(elementSelector);
    })
    .get();

  return items;
};

module.exports = scrapStream;
