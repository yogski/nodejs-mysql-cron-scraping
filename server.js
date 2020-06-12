//MODULES
const axios = require('axios').default;
const cheerio = require('cheerio');
const cron = require('node-cron');
const http = require('http');
const db = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

//CONSTANTS DECLARATION
const URL_TO_SCRAP = 'https://www.kontan.co.id/'

// DB Connection
const saveToDB = async (jsonData) => {
    // create the connection
    const connection = await db.createConnection({
        host: process.env.HOST, 
        user: process.env.USERDB,
        password: process.env.PASSWORD, 
        database: process.env.DB});
    // convert jsonData to array
    let arrayData = jsonData.map(function(item){
        var keys = [item.number, item.source, item.link, item.title]
        return keys
    });
    // query database
    const [a,b,c,d] = await connection.query('INSERT INTO news_kontan (number, news_source, link, title) VALUES ?', [arrayData]);
}

//HTTP Request using Axios
const fetchHtml = async url => {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch {
        console.error(`Error while fetching URL: ${url}`);
    }
};

//main scraper
const scrapStream = async () => {
    const targetUrl = URL_TO_SCRAP;
    console.log(`fetching ${targetUrl}`)
    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    //define DOM search here
    const query = $("div[class='isi fs20 ff-knowledge-r'] > h1 > a");

    var items = [];
    query.each(
        (idx, val) => {
            items.push({
                //define data here
                "number": idx+1,
                "source": URL_TO_SCRAP,
                "link": $(val).attr('href'),
                "title": $(val).text()
            });
        }
    );
    
    //save to DB here
    saveToDB(items);
    //success message with timestamp
    console.log(`Success fetching ${URL_TO_SCRAP} at ${(new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ")}`);

    return items;
};

//schedule every 3 hours
cron.schedule('*/3 * * *', scrapStream);

//testing: schedule every 20 seconds
// cron.schedule('*/20 * * * * *', scrapStream);

//server up and running
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<marquee>working in progress...</marquee>');
    res.end();
  }).listen(8081, () => {
    console.log(`Server is starting at port 8081`)
  });