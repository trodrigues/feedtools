var flatiron = require('flatiron'),
    app = flatiron.app,
    repeatedKeywordsHandler = require('./repeatedKeywordsHandler'),
    scrapersHandler = require('./scrapersHandler'),
    feedFetcher = require('./feedFetcher');

feedFetcher.createFetcher(require('./feedlist.json'));

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsHandler);
app.router.post('/filter/scraper', scrapersHandler);

app.start(3040);
