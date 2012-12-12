var redis = require('redis'),
    feedFetcher = require('./feedFetcher'),
    feedRenderer = require('./feedRenderer');

function Fetchers(params){
  var fetchers = this;
  this.logger = params.logger;
  this.redisClient = redis.createClient();
  this.feedParams = params;
  this.fetchers = [];
  this.fetcherReadyCount = 0;
  this.intervals = {};

  for(var feedName in params.feedGroups){
    var index = this.fetchers.length;
    this.fetchers.push(feedFetcher.createFetcher({
      name: feedName,
      logger: this.logger,
      data: params.feedGroups[feedName],
      redisClient: this.redisClient,
      instanceId: index
    }));
    this.fetchers[this.fetchers.length-1].on('ready', this.readyHandler.bind(this));
    this.fetchers[this.fetchers.length-1].on('insertionError', function(err) {
      fetchers.logger.error('insertion error', {error: err});
    });
    this.fetchers[this.fetchers.length-1].on('storedArticleError', function(err) {
      fetchers.logger.error('stored article error', {error: err});
      fetchers.terminateFetching();
    });
  }
}


Fetchers.prototype.readyHandler = function readyHandler(index) {
  var fetchers = this;
  this.renderer = feedRenderer.createRenderer({
    fetcher: this.fetchers[index],
    logger: this.logger
  });

  this.logger.info('setting up route', {name: this.fetchers[index].name});
  this.feedParams.createRoute('/rss/'+this.fetchers[index].name, this.makeFeedHandler());

  // update and start fetcher
  this.fetchers[index].fetchFromSource();
  this.intervals[index] = setInterval(function() {
    fetchers.fetchers[index].fetchFromSource();
  }, 3600000);

  this.terminateFetching();
};


Fetchers.prototype.makeFeedHandler = function makeFeedHandler() {
  var fetchers = this;
  return function feedHandler() {
    var handler = this,
        format = 'xml',
        headers = {'Content-Type': 'application/rss+xml'};

    if(handler.req.query.json == 'true'){
      headers['Content-Type'] = 'application/json';
      format = 'json';
    }

    fetchers.renderer.render({
      format: format
    }, function(renderedFeed) {
      handler.res.writeHead(200, headers);
      handler.res.end(renderedFeed);
    });
  }
};


Fetchers.prototype.terminateFetching = function terminateFetching() {
  this.fetcherReadyCount++;
  if(this.fetcherReadyCount === this.fetchers.length){
    this.feedParams.terminateFetching();
  }
};


module.exports = {
  createFetchers: function(params){
    return new Fetchers(params);
  }
};
