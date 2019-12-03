const cheerio = require('cheerio');
const iconv = require('iconv-lite');
module.exports = {
  parse: (requestObj, body) => {
    try {
      const $ = cheerio.load(iconv.decode(body, 'gb2312').toString());
      let returnResult = [];
      $('dl').each((i, dl) => {
        let $dl = cheerio.load(dl);
        let link = $dl('dt a').attr('href').split('?')[0];
        let ansCount = parseInt($dl('.f-light.nod').text().split('个')[0]) || 0;
        let likeCount = parseInt($dl('span.f-black').text().replace('\n', '').replace(' ', '')) || 0;
        let theResult = {
          'link': link,
          'title': $dl('dt a').text(),
          'cite': link,
          'domain': 'zhidao.baidu.com',
          'preview': $dl('.dd.answer').text(),
          'isQA': true,
          'ansCount': ansCount,
          'score': likeCount * ansCount,
          'hiddenScore': {
            'ans': ansCount,
            'like': likeCount,
          }
        }
        returnResult.push(theResult);
      });
      return {
        answers: returnResult,
      }
    } catch {
      return {}
    }
  }
}