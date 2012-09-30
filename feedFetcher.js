var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    FeedParser = require('FeedParser');

function FeedFetcher(params) {
  this.params = params;
  this.name = params.name;
  this.feedList = params.list;
  this.parser = new FeedParser();
  this.redisClient = params.redisClient;

  this.redisClient.on('error', function(err) {
    console.log('Redis error:', err);
  });

  this.parser.on('article', this.incomingArticleHandler.bind(this));
  this.getStoredArticles();
}
util.inherits(FeedFetcher, EventEmitter2);

FeedFetcher.prototype.incomingArticleHandler = function (article) {
  var duplicate = false,
      self = this;
  for(var i=0; i<this.storedArticles.length; i++){
    if(this.storedArticles[i].title === article.title){
      duplicate = true;
      break;
    }
  }
  if(!duplicate){
    this.redisClient.lpush(this.name, JSON.stringify(article), function(err, replies) {
      self.emit('insertionError', err);
    });
  }
};

FeedFetcher.prototype.parseList = function () {
  this.feedList.forEach(function(url) {
    console.log('parsing', url);
    this.parser.parseUrl(url);
  }, this);
};

FeedFetcher.prototype.getStoredArticles = function() {
  var self = this;
  this.redisClient.llen(this.name, function(err, len) {
    if(err){ return self.emit('storedArticleError', err); }
    self.redisClient.lrange(self.name, 0, len, function(err, replies) {
      if(err){ return self.emit('storedArticleError', err); }
      var parsedReplies = [];
      replies.forEach(function(reply) {
        parsedReplies.push(JSON.parse(reply));
      });
      self.storedArticles = parsedReplies;
      self.emit('ready', self.params.index);
    });
  });
};

module.exports = {
  createFetcher: function(params) {
    return new FeedFetcher(params);
  }
};