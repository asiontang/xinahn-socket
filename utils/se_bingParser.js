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
  parse: (body) => {
    const $ = cheerio.load(body)

    const startParse = performance.now();
    let suggestion = '';

    try {
      let sp_requery = $('#sp_requery a');
      if (sp_requery) suggestion = sp_requery.text();
    } catch {}

    let returnResult = []

    $('.b_algo').each((i, elm) => {
      let = theResult = {
        'link': $('a', elm).attr('href'),
        'title': $('h2', elm).text(),
        'cite': $('cite', elm).text(),
        'domain': url_to_domain($('a', elm).attr('href')),
        'preview': $('.b_caption p', elm).text(),
        'isQA': false,
        'QA': [],
      }
      if ($('.b_fc2', elm).length) {
        theResult.isQA = true;
        $('.b_fc2 tr a', elm).each((i, qa_elm) => {
          let theAnswer = {
            'title': qa_elm.text(),
            'link': qa_elm.attr('href'),
          };
          theResult.QA.push(theAnswer);
        });
      }
      returnResult.push(theResult);
    });
    const endParse = performance.now();
    console.log('[BING] Result length: ', returnResult.length);
    console.log('End parsing with time: ' + (endParse - startParse) + ' ms');
    return {
      suggestion,
      results: returnResult,
    }
  }
}