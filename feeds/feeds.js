var redis = require('redis'),
    feedFetcher = require('./feedFetcher'),
    feedRenderer = require('./feedRenderer'),
    feedParams,
    fetchers = [],
    fetcherReadyCount = 0,
    intervals = {},
    redisClient = redis.createClient();

function createFetchers(params){
  feedParams = params;

  for(var feedName in params.feedGroups){
    var index = fetchers.length;
    fetchers.push(feedFetcher.createFetcher({
      name: feedName,
      data: params.feedGroups[feedName],
      redisClient: redisClient,
      instanceId: index
    }));
    fetchers[fetchers.length-1].on('ready', readyHandler);
    fetchers[fetchers.length-1].on('insertionError', function(err) {
      console.log('insertion error', err);
    });
    fetchers[fetchers.length-1].on('storedArticleError', function(err) {
      console.log('stored article error', err);
      terminateFetching();
    });
  }
}


function readyHandler(index) {
  var renderer = feedRenderer.createRenderer({
    fetcher: fetchers[index]
  });

  console.log('setting up route for', fetchers[index].name);
  feedParams.createRoute('/rss/'+fetchers[index].name, makeFeedHandler(renderer));

  // update and start fetcher
  fetchers[index].fetchFromSource();
  intervals[index] = setInterval(function() {
    fetchers[index].fetchFromSource();
  }, 3600000);

  terminateFetching();
}


function makeFeedHandler(renderer) {
  return function feedHandler() {
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
  }
}


function terminateFetching() {
  fetcherReadyCount++;
  if(fetcherReadyCount === fetchers.length){
    feedParams.terminateFetching();
  }
}


module.exports = {
  createFetchers: createFetchers
};
