var flatiron = require('flatiron'),
    app = flatiron.app,
    redis = require('redis'),
    repeatedKeywordsHandler = require('./repeatedKeywordsHandler'),
    scrapersHandler = require('./scrapersHandler'),
    feedFetcher = require('./feedFetcher');

var fetchers = [],
    intervals = {},
    feedGroups = require('./feedlist.json'),
    redisClient = redis.createClient();

function readyHandler(index) {
  fetchers[index].parseList();
  intervals[index] = setInterval(function() {
    fetchers[index].parseList();
  }, 3600000);
}

function fetcherErrorHandler(err) {
  console.log('lol fail', err);
}

for(var feedName in feedGroups){
  var index = fetchers.length;
  fetchers.push(feedFetcher.createFetcher({
    name: feedName,
    list: feedGroups[feedName],
    redisClient: redisClient,
    index: index
  }));
  fetchers[fetchers.length-1].on('ready', readyHandler);
  fetchers[fetchers.length-1].on('error', readyHandler);
}

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsHandler);
app.router.post('/filter/scraper', scrapersHandler);

app.start(3040);
