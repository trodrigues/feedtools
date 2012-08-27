var flatiron = require('flatiron'),
    logger = require('winston'),
    app = flatiron.app,
    repeatedKeywords = require('./repeatedKeywordsHandler')(logger),
    scrapers = require('./scrapersHandler')(logger);

app.use(flatiron.plugins.http);

logger.cli();

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywords);
app.router.post('/scraper/wired', scrapers.wired);

app.start(3040);
