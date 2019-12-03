const perfhooks = require('perf_hooks');
const performance = perfhooks.performance;
const request = require('request');
const googleParser = require('./se_googleParser');
const baiduParser = require('./se_baiduParser');
const bingParser = require('./se_bingParser');
const baikeParser = require('./se_baikeParser');
const zhidaoParser = require('./se_zhidaoParser');
const zhihuParser = require('./se_zhihuParser');

const space_split_and_uriencode = query => {
  let result_arr = [];
  for(let q of query.split(' ')) {
    result_arr.push(encodeURI(q));
  }
  return result_arr.join('+');
}

module.exports = {
  parrallelApiDriver: ({ driver, query, page }) => {
    return new Promise(async (resolve, reject) => {
      const startLoad = performance.now()
      console.log('[MINION] https://cn.bing.com/search?q=' + space_split_and_uriencode(query) + '&mkt=zh-CN&first=' + (1 + (page - 1) * 10).toString())
      try {
        await driver.get('https://cn.bing.com/search?q=' + space_split_and_uriencode(query) + '&mkt=zh-CN&first=' + (1 + (page - 1) * 10).toString());
      } catch {
        await driver.executeScript('window.stop()')
      }
      const endLoad = performance.now();
      console.log('done loading with time: ' + (endLoad - startLoad) + ' ms')

      const startAwait = performance.now()
      const body = await driver.getPageSource()
      const endAwait = performance.now();
      console.log('done waiting with time: ' + (endAwait - startAwait) + ' ms')

      resolve(bingParser.parse(body));
    })
  },
  parrallelApiMisc: ({ requestObj, source }) => {
    return new Promise(function (resolve, reject) {
      //our fake api simply returns the string passed as the 'url'
      try {
        request(
          requestObj,
          (err, response, body) => {
            if (err) resolve({ error: `${source} request error`})
            if (source === 'google') resolve(googleParser.parse(requestObj, body));
            if (source === 'baidu') resolve(baiduParser.parse(requestObj, body));
            if (source === 'baike') resolve(baikeParser.parse(requestObj, body));
            if (source === 'zhihu') resolve(zhihuParser.parse(requestObj, body));
            if (source === 'zhidao') resolve(zhidaoParser.parse(requestObj, body));
            resolve({ error: 'source not supported' });
          }
        )
      } catch {
        resolve({ error: 'cheerio failed' });
      }
    })
  },
  makeRequestGoogle: ({ googleip, query }) => {
    return {
      method: 'GET',
      uri: `http://${googleip}/api?query=${encodeURI(query)}&secret=YOUR_GOOGLE_SECRET`,
      headers: {
        'Content-Type': 'applicatoin/json',
      },
      timeout: 2000
    }
  },
  makeRequestBaidu: ({ query, page }) => {
    return {
      method: 'GET',
      uri: `https://www.baidu.com/s?ie=utf-8&wd=${query}&pn=${(page - 1) * 10}`,
      headers: {
        'Host': 'www.baidu.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
      },
      timeout: 1000
    }
  },
  makeRequestBaike: ({ query }) => {
    return {
      method: 'GET',
      uri: `https://www.baike.com/wiki/${encodeURI(query)}`,
      headers: {
        'Host': 'www.baike.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
      },
      timeout: 800
    }
  },
  makeRequestZhihu: ({ query }) => {
    return {
      method: 'GET',
      uri: `https://www.zhihu.com/search?type=content&q=${encodeURI(query)}`,
      headers: {
        'Host': 'www.zhihu.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
      },
      timeout: 1000
    }
  },
  makeRequestZhidao: ({ query }) => {
    return {
      method: 'GET',
      uri: `https://zhidao.baidu.com/search?lm=0&rn=10&pn=0&fr=search&ie=gbk&word=${encodeURI(query)}`,
      headers: {
        'Host': 'zhidao.baidu.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
      },
      encoding: null,
      timeout: 800
    }
  },
  makeRequestDuitang: ({ query, page }) => {
    return {
      method: 'GET',
      uri: `https://www.duitang.com/napi/blog/list/by_search/?kw=${encodeURI(query)}&start=0&limt=${page}`,
      headers: {
        'Host': 'www.duitang.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
      },
      encoding: null,
      timeout: 800
    }
  },
}