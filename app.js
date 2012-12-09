var flatiron = require('flatiron'),
    app = flatiron.app,
    repeatedKeywordsController = require('./controllers/repeatedKeywords'),
    scrapersController = require('./controllers/scrapers'),
    feeds = require('./feeds');

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsController);
app.router.post('/filter/scraper', scrapersController);

feeds.createFetchers({
  feedGroups: require('./feedlist2.json'),
  createRoute: function(routePath, requestHandler) {
    app.router.get(routePath, requestHandler);
  },
  terminateFetching: function() {
    console.log('starting server');
    app.start(3040);
  }
});
