const blocklist = require('./blocklist');
const tldparser = require('tld-extract');
const url_to_domain = url => {
  try {
    url = url.replace('https://', '').replace('http://', '');
    url = url.split('/')[0].split('>')[0]
    let tldInfo = tldparser('https://' + url)
    return tldInfo.domain;
  } catch {
    return ''
  }
}
module.exports = {
  parse: (requestObj, body) => {
    try {
      const results_ = JSON.parse(body).results;
      let results = [];
      for (let r_ of results_) {
        r_['domain'] = url_to_domain(r_['link'])
        console.log(r_['domain'])
        if (blocklist.get_list().indexOf(r_['domain']) === -1) {
          results.push(r_);
        }
      }
      const gResults = results.splice(0, 2);
      return {
        gResults,
        results,
      }
    } catch {
      return {}
    }
  }
}