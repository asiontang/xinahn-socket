const cheerio = require('cheerio');
module.exports = {
  parse: (requestObj, body) => {
    try {
      const $ = cheerio.load(body)
      // return {}
      let polysemy = []
      let title = $('title').text()
      if (title.endsWith('_搜索_互动百科')) return { wiki: {} };
      let preview = $('meta[name="description"]').attr('content')
      let excludePoly = ['展开','收起','纠错','编辑多义词'];
      $('.polysemy a').each((i, elm) => {
        let p_ = elm.children[0].data;
        if (excludePoly.indexOf(p_) === -1) {
          polysemy.push(elm.children[0].data);
        }
      });
      return {
        results: [{
          title,
          preview,
          link: requestObj.uri,
          domain: 'baike.com',
          cite: requestObj.uri,
          polysemy
        }]
      }
    } catch {
      return {}
    }
  }
}