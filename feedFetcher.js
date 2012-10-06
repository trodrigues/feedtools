var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    FeedParser = require('FeedParser');

function FeedFetcher(params) {
  this.params = params;
  this.name = params.name;
  this.feedList = params.data.feeds;
  this.parser = new FeedParser();
  this.redisClient = params.redisClient;

  this.redisClient.on('error', function(err) {
    console.log('Redis error:', err);
  });

  // set handler for feed parser's articles
  this.parser.on('article', this.incomingArticleHandler.bind(this));

  // fetch previously stored articles
  this.on('storedArticles', function(instanceId) {
    this.emit('ready', instanceId);
  }.bind(this));
  this.fetchStoredArticles();
}
util.inherits(FeedFetcher, EventEmitter2);

FeedFetcher.prototype.getFeedMetadata = function () {
  return this.params.data;
};


FeedFetcher.prototype.isDuplicate = function (article) {
 for(var i=0; i<this.existingArticles.length; i++){
    if(this.existingArticles[i].title === article.title){
      return true;
    }
  }
  return false;
};


FeedFetcher.prototype.incomingArticleHandler = function (article) {
   if(!this.isDuplicate(article)){
    this.redisClient.lpush(this.name, JSON.stringify(article), function(err, replies) {
      if(err !== null){
        this.emit('insertionError', err, article);
      }
    }.bind(this));
  }
};


FeedFetcher.prototype.fetchFromSource = function () {
  this.feedList.forEach(function(url) {
    console.log('parsing', url);
    this.parser.parseUrl(url);
  }, this);
};


FeedFetcher.prototype.fetchStoredArticles = function() {
  this.redisClient.llen(this.name, function(err, len) {
    if(err){ return this.emit('storedArticleError', err); }

    this.redisClient.lrange(this.name, 0, len, function(err, replies) {
      if(err){ return this.emit('storedArticleError', err); }

      var parsedReplies = [];
      replies.forEach(function(reply) {
        parsedReplies.push(JSON.parse(reply));
      });

      this.existingArticles = parsedReplies;
      this.emit('storedArticles', this.params.instanceId, parsedReplies);

    }.bind(this));
  }.bind(this));
};


module.exports = {
  createFetcher: function(params) {
    return new FeedFetcher(params);
  }
};