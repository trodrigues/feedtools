var flatiron = require('flatiron'),
    app = flatiron.app,
    redis = require('redis'),
    repeatedKeywordsHandler = require('./repeatedKeywordsHandler'),
    scrapersHandler = require('./scrapersHandler'),
    feedFetcher = require('./feedFetcher');

var fetchers = [],
    fetcherReadyCount = 0,
    intervals = {},
    feedGroups = require('./feedlist.json'),
    redisClient = redis.createClient();

function attemptServerStart() {
  fetcherReadyCount++;
  if(fetcherReadyCount == fetchers.length){
    app.start(3040);
  }
}

function readyHandler(index) {
  fetchers[index].parseList();
  intervals[index] = setInterval(function() {
    fetchers[index].parseList();
  }, 3600000);
  attemptServerStart();
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
  fetchers[fetchers.length-1].on('insertionError', function(err) {console.log(err);});
  fetchers[fetchers.length-1].on('storedArticleError', function(err) {console.log(err); attemptServerStart();});
}


app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsHandler);
app.router.post('/filter/scraper', scrapersHandler);

