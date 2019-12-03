const api = require('./utils/api');
const query = '粤语';
const page = 1;

var run = async () => {
  // const result = await api.parrallelApiMisc({ requestObj: api.makeRequestBaike({ query, page }), source: 'baike' });
  // const result = await api.parrallelApiMisc({ requestObj: api.makeRequestZhihu({ query, page }), source: 'zhihu' });
  const result = await api.parrallelApiMisc({ requestObj: api.makeRequestZhidao({ query }), source: 'zhidao' });
  console.log('test result: ', result)
}
run();
