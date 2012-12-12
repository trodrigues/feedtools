var flatiron = require('flatiron'),
    logger = require('winston'),
    app = flatiron.app,
    repeatedKeywordsController = require('./controllers/repeatedKeywords'),
    scrapersController = require('./controllers/scrapers'),
    feeds = require('./feeds');


app.use(flatiron.plugins.http);
app.config.use('file', {file: __dirname+'/config/config.json'});

if(app.config.get('env') == 'prod'){
  logger.add(logger.transports.File, {
    level: app.config.get('logLevel'),
    filename: 'logs/app.log'
  });
} else {
  logger.remove(logger.transports.Console);
}

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsController);
app.router.post('/filter/scraper', scrapersController);

feeds.createFetchers({
  feedGroups: require(app.config.get('feedlist')),
  createRoute: function(routePath, requestHandler) {
    app.router.get(routePath, requestHandler);
  },
  terminateFetching: function() {
    logger.warn('starting server', {port: app.config.get('port')});
    app.start(app.config.get('port'));
  }
});
