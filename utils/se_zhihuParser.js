const cheerio = require('cheerio');
const fs = require('fs');

module.exports = {
  parse: (requestObj, body) => {
    try {
      const $ = cheerio.load(body)
      const json = $('script[id="js-initialData"]');
      const data = JSON.parse(json.get()[0].children[0].data);
      const answersRaw = data.initialState.entities.answers;
      let answers = [];
      let wiki = {};
      if (data.initialState.entities.wiki_box) {
        for(let id in data.initialState.entities.wiki_box) {
          const wikiBoxData = data.initialState.entities.wiki_box[id];
          wiki = {
            title: cheerio.load(wikiBoxData.name).text(),
            preview: cheerio.load(wikiBoxData.excerpt).text(),
            link: `https://www.zhihu.com/topic/${wikiBoxData.id}`,
            domain: 'zhihu.com',
            cite: 'zhihu.com/wiki',
            picture: wikiBoxData.avatarUrl,
          }
        }
      }
      for(let aid in answersRaw) {
        answers.push({
          type: 'qa',
          title: cheerio.load(answersRaw[aid].question.name).text(),
          preview: cheerio.load(answersRaw[aid].excerpt).text(),
          link: `https://www.zhihu.com/question/${answersRaw[aid].question.id}/answer/${aid}`,
          domain: 'zhihu.com',
          cite: `https://www.zhihu.com/question/${answersRaw[aid].question.id}/answer/${aid}`,
          createdAt: answersRaw[aid].createdTime,
          updatedAt: answersRaw[aid].updatedTime,
          score: (answersRaw[aid].voteupCount + answersRaw[aid].commentCount),
        })
      }
      const articlesRaw = data.initialState.entities.articles;
      let articles = [];
      for(let aid in articlesRaw) {
        let thumbnail = '';
        if (articlesRaw[aid].thumbnailInfo.count) {
          thumbnail = articlesRaw[aid].thumbnailInfo.thumbnails[0].url;
        }
        articles.push({
          type: 'article',
          thumbnail,
          title: cheerio.load(articlesRaw[aid].title).text(),
          preview: cheerio.load(articlesRaw[aid].excerpt).text(),
          link: `https://zhuanlan.zhihu.com/p/${aid}`,
          domain: 'zhuanlan.zhihu.com',
          cite: `https://zhuanlan.zhihu.com/p/${aid}`,
          createdAt: articlesRaw[aid].createdTime,
          updatedAt: articlesRaw[aid].updatedTime,
          score: (articlesRaw[aid].voteupCount + articlesRaw[aid].commentCount),
        })
      }
      let relevantQuery = [];
      if (data.initialState.entities.searchAdvancedGeneral) {
        const relevantQueryRaw = data.initialState.entities.searchAdvancedGeneral.search_relevant_query;
        if (relevantQueryRaw)
          for(let rq of relevantQueryRaw.queryList) {
            relevantQuery.push(rq.query);
          }
      }
      fs.appendFileSync('./temp/zhihu/entities.txt', JSON.stringify(data.initialState.entities) + '\n');
      return {
        zhWiki: wiki,
        zhAnswers: answers,
        zhArticles: articles,
        relevantQuery,
      }
    } catch {
      console.log('[ZHIHU] parser went wrong...')
      return {}
    }
  }
}