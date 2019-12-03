// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
const express    = require('express');  
const cheerio = require('cheerio');
const app        = express();
const bodyParser = require('body-parser');
const perfhooks = require('perf_hooks');
const performance = perfhooks.performance;

const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

const options = new chrome.Options()
  .addArguments('headless')
  .addArguments('disable-gpu')
  .addArguments('start-maximized')
  .addArguments('incognito')
  .setUserPreferences({
    'profile.managed_default_content_settings.images': 2,
    'disk-cache-size': 4096
  })

let driver;
let driverReady = false;
const init = async () => {
  driver = await new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .setChromeOptions(options)
    .build();
  await driver.get('https://www.google.com.hk');
  driverReady = true;
  console.log('[MINION] Driver ready to serve');
  // await driver.manage().setTimeouts({ pageLoad: 1000 })
}
init()

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 8081;        // set our port

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:PORT/api)
router.get('/', async (req, res) => {
  
  const startLoad = performance.now()
  const {
    query,
    secret,
  } = req.query;
  if (!driverReady) return res.json({ err: 'driver not ready' });
  if (secret !== 'YOUR_GOOGLE_SECRET') return res.json({ err: 'some error' });

  try {
    await driver.get(`https://www.google.com.hk/search?q=${encodeURI(query)}`);
  } catch {
    await driver.executeScript('window.stop()')
  }
  const endLoad = performance.now();
  console.log('done loading with time: ' + (endLoad - startLoad) + ' ms')

  const startAwait = performance.now()
  const body = await driver.getPageSource()
  const endAwait = performance.now();
  console.log('done waiting with time: ' + (endAwait - startAwait) + ' ms')
  const $ = cheerio.load(body)
  let results = []
  $('.g').each((i, el) => {
    // console.log(i, el)
    let $result = cheerio.load(el);
    if ($result('cite').text())
      results.push({
        title: $result('a h3').text(),
        link: $result('a').attr('href'),
        cite: $result('cite').text(),
        preview: $result('.s').text(),
      });

  })
  if(results.length == 0) console.log($('title'))
  // return res.send(body);
  return res.json({ results });

});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);