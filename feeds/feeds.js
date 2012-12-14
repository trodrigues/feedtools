var redis = require('redis'),
    moment = require('moment'),
    feedFetcher = require('./feedFetcher'),
    feedRenderer = require('./feedRenderer');

function Feeds(params){
  var feeds = this;
  var index;
  this.logger = params.logger;
  this.redisClient = redis.createClient();
  this.params = params;
  this.params.fetchInterval = (this.params.fetchInterval || 3600) * 1000;
  this.fetchers = [];
  this.renderers = [];
  this.fetcherReadyCount = 0;

  for(var feedName in params.feedGroups){
    index = this.fetchers.length;
    this.fetchers.push(feedFetcher.createFetcher({
      name: feedName,
      logger: this.logger,
      data: params.feedGroups[feedName],
      redisClient: this.redisClient,
      instanceId: index
    }));
    this.fetchers[this.fetchers.length-1].on('ready', this.readyHandler.bind(this));
    this.fetchers[this.fetchers.length-1].on('insertionError', function(err) {
      feeds.logger.error('insertion error', {error: err});
    });
    this.fetchers[this.fetchers.length-1].on('storedArticleError', function(err) {
      feeds.logger.error('stored article error', {error: err});
      feeds.terminateFetching();
    });
  }
}


Feeds.prototype.readyHandler = function readyHandler(index) {
  var feeds = this;
  this.renderers[index] = feedRenderer.createRenderer({
    fetcher: this.fetchers[index],
    logger: this.logger
  });

  this.logger.info('setting up route', {name: this.fetchers[index].name});
  this.params.createRoute('/rss/'+this.fetchers[index].name, this.makeFeedHandler(index));

  // update and start fetcher
  this.fetchers[index].fetchFromSource();
  this.fetchingInterval = setInterval(function() {
    feeds.fetchers[index].fetchFromSource();
  }, this.params.fetchInterval);

  this.terminateFetching();
};


Feeds.prototype.makeFeedHandler = function makeFeedHandler(index) {
  var feeds = this;
  return function feedHandler() {
    var handler = this,
        timeFormat = 'ddd, DD MMM YYYY HH:mm:ss [GMT]';
        format = 'xml',
        headers = {'Content-Type': 'application/rss+xml'};

    if(handler.req.query.json == 'true'){
      headers['Content-Type'] = 'application/json';
      format = 'json';
    }

    var now = moment();
    headers['Last-Modified'] = now.format(timeFormat);
    headers.Expires = now.add('m', 30).format(timeFormat);
    headers['Cache-Control'] = 'max-age=1800, must-revalidate';

    feeds.renderers[index].render({
      format: format
    }, function(renderedFeed) {
      headers['Content-Length'] = Buffer.byteLength(renderedFeed);
      handler.res.writeHead(200, headers);
      handler.res.end(renderedFeed);
    });
  }
};


Feeds.prototype.terminateFetching = function terminateFetching() {
  this.fetcherReadyCount++;
  if(this.fetcherReadyCount === this.fetchers.length){
    this.params.terminateFetching();
  }
};


module.exports = {
  createFeeds: function(params){
    return new Feeds(params);
  }
};
