var flatiron = require('flatiron'),
    app = flatiron.app,
    redis = require('redis'),
    repeatedKeywordsHandler = require('./repeatedKeywordsHandler'),
    scrapersHandler = require('./scrapersHandler'),
    feedFetcher = require('./feedFetcher'),
    feedRenderer = require('./feedRenderer');

var fetchers = [],
    fetcherReadyCount = 0,
    intervals = {},
    feedGroups = require('./feedlist.json'),
    redisClient = redis.createClient();

function attemptServerStart() {
  fetcherReadyCount++;
  if(fetcherReadyCount == fetchers.length){
    console.log('starting server');
    app.start(3040);
  }
}

function readyHandler(index) {
  var renderer = feedRenderer.createRenderer({
    fetcher: fetchers[index]
  });

  console.log('setting up route for', fetchers[index].name);
  app.router.get('/rss/'+fetchers[index].name, function() {
    var self = this,
        format = 'xml',
        headers = {'Content-Type': 'application/rss+xml'};

    if(self.req.query.json == 'true'){
      headers['Content-Type'] = 'application/json';
      format = 'json';
    }

    renderer.render({
      format: format
    }, function(renderedFeed) {
      self.res.writeHead(200, headers);
      self.res.end(renderedFeed);
    });
  });

  fetchers[index].fetchFromSource();
  intervals[index] = setInterval(function() {
    fetchers[index].fetchFromSource();
  }, 3600000);
  attemptServerStart();
}

for(var feedName in feedGroups){
  var index = fetchers.length;
  fetchers.push(feedFetcher.createFetcher({
    name: feedName,
    data: feedGroups[feedName],
    redisClient: redisClient,
    instanceId: index
  }));
  fetchers[fetchers.length-1].on('ready', readyHandler);
  fetchers[fetchers.length-1].on('insertionError', function(err) {console.log('insertion error', err);});
  fetchers[fetchers.length-1].on('storedArticleError', function(err) {console.log('stored article error', err); attemptServerStart();});
}


app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', repeatedKeywordsHandler);
app.router.post('/filter/scraper', scrapersHandler);

