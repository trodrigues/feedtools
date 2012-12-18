var flatiron = require('flatiron'),
    winston = require('winston'),
    logger,
    app = flatiron.app,
    repeatedKeywordsController = require('./controllers/repeatedKeywords'),
    scrapersController = require('./controllers/scrapers'),
    feeds = require('./feeds');

app.use(flatiron.plugins.http);
app.config.argv()
          .env()
          .use('file', {file: __dirname+'/config/config.json'});

var transports = [];
if(app.config.get('NODE_ENV') == 'production'){
  transports.push(new winston.transports.File({
    level: app.config.get('logLevel'),
    filename: __dirname+'/logs/app.log',
    timestamp: true,
    json: true,
    maxsize: 500 * 1024
  }));
} else {
  transports.push(new winston.transports.Console({
    level: app.config.get('logLevel'),
    colorize: true
  }));
}

var logger = new winston.Logger({
  transports: transports
});

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsController);
app.router.post('/filter/scraper', scrapersController);

feeds.createFeeds({
  logger: logger,
  fetchInterval: app.config.get('fetchInterval'),
  feedGroups: require(app.config.get('feedlist')),
  createRoute: function(routePath, requestHandler) {
    app.router.get(routePath, requestHandler);
  },
  terminateFetching: function() {
    logger.warn('starting server', {port: app.config.get('port')});
    app.start(app.config.get('port'));
  }
});
