var flatiron = require('flatiron'),
    app = flatiron.app,
    repeatedKeywordsHandler = require('./repeatedKeywordsHandler'),
    scrapersHandler = require('./scrapersHandler'),
    feedFetcher = require('./feedFetcher');

var fetcher = feedFetcher.createFetcher(require('./feedlist.json'));
fetcher.getStoredArticles(function(err, articles) {
  console.log(articles.length);
});

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsHandler);
app.router.post('/filter/scraper', scrapersHandler);

app.start(3040);
