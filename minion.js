const ANTENNA_URL = 'http://localhost:4100';
const socket = require('socket.io-client')(ANTENNA_URL);
const mathjs = require('mathjs');
const chineseConv = require('chinese-conv');
const api = require('./utils/api');
const {
  Builder,
} = require('selenium-webdriver');
const perfhooks = require('perf_hooks');
const performance = perfhooks.performance;

const getDomain = link => {
  let domain = link.replace('https://', '').replace('http://', '').split('/')[0];
  if(domain.split('.').length > 2 && domain.startsWith('www.')) {
    domain = domain.replace('www.', '');
  }
  return domain;
}

const chrome = require('selenium-webdriver/chrome');
const options = new chrome.Options()
  .addArguments('headless')
  .addArguments('start-maximized')
  .addArguments('incognito')
  .addArguments('no-sandbox')
  .setUserPreferences({
    'profile.managed_default_content_settings.images': 2,
  })

let driver;
let driverReady = false;

let googleip = '';

socket.on('connect', function(){
  console.log('[MINION] Connected to mother server!');
  socket.emit('/auth', { authKey: 'YOUR_AUTH_KEY' });
});
socket.on('auth_success', async googleInfo => {
  console.log('[GOOGLE]', googleInfo);
  console.log('[MINION] auth success');
  googleip = googleInfo.GOOGLE_IP;
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  await driver.get('https://cn.bing.com');
  driverReady = true
  console.log('[MINION] Driver ready to serve');
  await driver.manage().setTimeouts({ pageLoad: 1000 })
})
socket.on('search', async ({ requestId, query, page }) => {
  console.log('[MINION] Incoming query: ', query);
  page = parseInt(page) || 1;
  query = query || '';
  query = query.toLowerCase();

  if (!driverReady) {
    console.log('[MINION] DRIVER NOT READY...');
    socket.emit(requestId, {
      success: true,
      errCode: 0,
      errMsg: '',
      results: [],
      suggestion: '',
    });
    return;
  }
  let response = {
    success: true,
    errCode: 0,
    errMsg: '',
    results: [],
    suggestion: '',
  };
  // Simplify
  try {
    query = chineseConv.sify(query);
  } catch {
    console.log('Simplify went wrong...');
  }
  // Simple query checker
  const alphabetTest = /[a-zA-Z]+/;
  let oneWord = true;
  query = query.replace(/ +/g, ' ');
  if (query.endsWith(' ') && query.length > 1) query = query.substring(0, query.length - 1)
  if (query.indexOf(' ') !== -1 || query.indexOf('+') !== -1) oneWord = false;
  try {
    let mathResult = mathjs.evaluate(query);
    response['mathResult'] = mathResult;
  } catch {
  }
  console.log('[ENGINE] Before request...');
  const reqBK = api.parrallelApiMisc({ requestObj: api.makeRequestBaike({ query }), source: 'baike' });
  const reqZH = api.parrallelApiMisc({ requestObj: api.makeRequestZhihu({ query }), source: 'zhihu' });
  const reqZD = api.parrallelApiMisc({ requestObj: api.makeRequestZhidao({ query }), source: 'zhidao' });
  const reqBD = api.parrallelApiMisc({ requestObj: api.makeRequestBaidu({ query, page }), source: 'baidu' });
  const reqGO = api.parrallelApiMisc({ requestObj: api.makeRequestGoogle({ query, googleip }), source: 'google' });
  const reqBN = api.parrallelApiDriver({ driver, query, page });

  // Images
  // const reqDT = api.parrallelApiMisc({ requestObj: api.makeRequestDuitang({ query }), source: 'duitang' });

  let parrallelRequests = [];
  if (page == 1) {
    if (alphabetTest.test(query) && oneWord) {
      // One English word
      // TODO: dictionary
      parrallelRequests = [reqBK, reqZH, reqBN, reqZD, reqBD, reqGO];
    } else if (oneWord) {
      // One non-English word
      parrallelRequests = [reqBK, reqZH, reqBN, reqZD, reqBD, reqGO];
    } else {
      parrallelRequests = [reqZH, reqBN, reqZD, reqBD, reqGO];
    }
  } else {
    parrallelRequests = [reqBN, reqBD];
  }

  const requestResults = await Promise.all(parrallelRequests)
  console.log('queried: "', query, '", of page: ', page);
  // Strict match
  const startCleaning = performance.now();
  let results = [];
  let domains = [];
  let zhihus = [];
  let wiki = {};
  for(let r of requestResults) {
    if (r.error) continue;
    if (r.bkWiki) {
      // console.log(r.bkWiki)
    }
    if (r.zhWiki) wiki = r.zhWiki;
    if (r.zhAnswers) {
      for (let r_ of r.zhAnswers) {
        domains.push(r_['domain']);
        let notStrict = false;
        for (let q of query.split(' ')) {
          if (r_.title.toLowerCase().indexOf(q.toLowerCase()) == -1) {
            notStrict = true;
          }
        }
        if (notStrict) {
          console.log('excluded: ' + r_['title'])
          continue;
        }
        r_['title'];
        zhihus.push(r_);
      }
    }
    if (r.zhArticles) {
      for (let r_ of r.zhArticles) {
        domains.push(r_['domain']);
        let notStrict = false;
        for (let q of query.split(' ')) {
          if (r_.title.toLowerCase().indexOf(q.toLowerCase()) == -1) {
            notStrict = true;
          }
        }
        if (notStrict) {
          console.log('excluded: ' + r_['title'])
          continue;
        }
        r_['isStrict'] = !notStrict;
        results.push(r_);
      }
    }
    if (r.results) {
      for (let r_ of r.results) {
        // if (r_.domain === 'baike.com') console.log(r_)
        if (!r_['domain']) r_['domain'] = getDomain(r_.link);
        r_['score'] = 0;
        domains.push(r_['domain']);
        let notStrict = false;
        for (let q of query.split(' ')) {
          if (r_.title.toLowerCase().indexOf(q.toLowerCase()) == -1) {
            notStrict = true;
          }
        }
        r_['isStrict'] = !notStrict;
        results.push(r_);
      }
    }
  }

  for(let r of requestResults) {
    if (r.bdResults) {
      for (let r_ of r.bdResults) {
        r_['score'] = 0;
        if (domains.indexOf(r_['domain']) !== -1) continue;

        domains.push(r_['domain']);
        let notStrict = false;
        for (let q of query.split(' ')) {
          if (r_.title.toLowerCase().indexOf(q.toLowerCase()) == -1) {
            notStrict = true;
          }
        }
        r_['isStrict'] = !notStrict;
        results.push(r_);
      }
    }
  }

  // Update pr score for each search objects.
  for (let r_ of results) {
    if (dList.indexOf(r_.domain) !== -1) {
      r_['score'] = dDict[r_.domain];
    }
  }
  results.sort((a, b) => {
    if (a.score < b.score)
      return 1;
    if (a.score > b.score)
      return -1;
    return 0;
  })

  zhihus.sort((a, b) => {
    if (a.score < b.score)
      return -1;
    if (a.score > b.score)
      return 1;
    return 0;
  })

  // Make the first result strict match for query
  let firstStrictIndex = 0;
  for (let ri in results) {
    if (results[ri].isStrict) {
      firstStrictIndex = ri;
      break;
    }
  }
  if (results.length) {
    let bestMatch = results.splice(firstStrictIndex, 1);
    results.unshift(bestMatch[0]);
  }
  // Make government websites rank the first, if there is one.
  let firstGovCnIndex = 0;
  for (let ri in results) {
    if (results[ri].domain.endsWith('.gov.cn')) {
      firstGovCnIndex = ri;
      break
    }
  }
  if (firstGovCnIndex) {
    let bestGovSite = results.splice(firstGovCnIndex, 1);
    results.unshift(bestGovSite[0]);
  }
  // Make promotions sink
  let firstPromotionIndex = Infinity;
  for (let ri in results) {
    if (results[ri].title.indexOf('优惠') !== -1) {
      firstPromotionIndex = ri;
      break
    }
  }
  if (firstPromotionIndex < Infinity) {
    let firstPromotionLink = results.splice(firstPromotionIndex, 1);
    results.concat(firstPromotionLink[0]);
  }
  for (let r_ of results) {
    try {
      r_['cite'] = r_['cite'].replace('http://', '').replace('https://', '');
      delete(r_.score);
      delete(r_.isStrict);
    } catch {
      console.log('[ERROR] ==> ', r_)
    }
  }
  for (let r_ of zhihus) {
    r_['cite'] = r_['cite'].replace('http://', '').replace('https://', '');
    delete(r_.score);
    delete(r_.isStrict);
  }

  // Make google results to the top 2
  for(let r of requestResults) {
    if (r.gResults) {
      for (let r_ of r.gResults) {
        console.log(r_)
        results.unshift(r_);
      }
    }
  }
  const endCleaning = performance.now();
  console.log('End cleaning with time: ' + (endCleaning - startCleaning) + ' ms');
  response.results = results;
  response.qa = {
    zhihus,
  };
  response.wiki = wiki;
  socket.emit(
    requestId,
    response
  );
});
socket.on('disconnect', function(){
  console.log('[MINION] Mother server went offline D:');
});