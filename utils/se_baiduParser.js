const cheerio = require('cheerio');
const tldparser = require('tld-extract');
const perfhooks = require('perf_hooks');
const performance = perfhooks.performance;
const url_to_domain = url => {
  try {
    url = url.replace('https://', '').replace('http://', '');
    url = url.split('/')[0].split('>')[0]
    let tldInfo = tldparser('https://' + url)
    let prefix = tldInfo.sub !== 'www' && tldInfo.sub ? tldInfo.sub + '.' : '';
    return prefix + tldInfo.domain;
  } catch {
    return ''
  }
}

module.exports = {
  parse: (requestObj, body) => {
    try {
      const $ = cheerio.load(body)
      const startParse = performance.now();
      let suggestion = '';
      let returnResult = []
      $('.result.c-container').each((i, el) => {
        let $result = cheerio.load(el);
        const title = $result('.t').text();
        const link = $result('.t a').attr('href');
        const preview = $result('.c-abstract').text();
        if ($result('.c-showurl').text().startsWith('http')) {
          const domain = url_to_domain($result('.c-showurl').text());
          returnResult.push({
            title,
            link,
            preview,
            domain,
            cite: domain,
          });
        }
      })
      return {
        bdResults: returnResult,
      };
    } catch {
      return {}
    }
  }
}