var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    redis = require('redis'),
    FeedParser = require('FeedParser');

function FeedFetcher(list) {
  this.feedList = list;
  this.parser = new FeedParser();
  this.redisClient = redis.createClient();

  this.redisClient.on('error', function(err) {
    console.log('Redis error:', err);
  });

  this.parser.on('article', this.incomingArticleHandler.bind(this));
}
util.inherits(FeedFetcher, EventEmitter2);

FeedFetcher.prototype.incomingArticleHandler = function (article) {
  this.redisClient.lpush('articles', JSON.stringify(article), function(err, replies) {
    console.log('>>>>> item');
    console.log(err);
    console.log(replies);
  });
};

FeedFetcher.prototype.parseList = function (article) {
  console.log('fetching from', this.feedList[0]);
  this.parser.parseUrl(this.feedList[0]);
};

FeedFetcher.prototype.getStoredArticles = function(cb) {
  var self = this;
  this.redisClient.llen('articles', function(err, len) {
    if(err && cb){ return cb(err); }
    self.redisClient.lrange('articles', 0, len, function(err, replies) {
      if(err && cb){ return cb(err); }
      var parsedReplies = [];
      replies.forEach(function(reply) {
        parsedReplies.push(JSON.parse(reply));
      });
      if(cb){
        cb(null, parsedReplies);
      }
    });
  });
};

module.exports = {
  createFetcher: function(list) {
    return new FeedFetcher(list);
  }
};