var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    async = require('async'),
    feedparser = require('feedparser');

function FeedFetcher(params) {
  var fetcher = this;
  this.params = params;
  this.logger = params.logger;
  this.name = params.name;
  this.feedList = params.data.feeds;
  this.redisClient = params.redisClient;
  this.existingArticles = null;

  this.logger.warn('Creating a fetcher for '+this.params.name);

  this.expires = this.getExpiryDate();

  this.redisClient.on('error', function(err) {
    fetcher.logger.error('Redis error', {error: err});
  });

  // emit ready event the first time stored articles are fetched
  this.once('storedArticles', function(instanceId) {
    fetcher.emit('ready', instanceId);
  });

  this.on('storedArticles', this.cleanupOldArticles.bind(this));

  this.fetchStoredArticles();
}
util.inherits(FeedFetcher, EventEmitter2);


FeedFetcher.prototype.getExpiryDate = function () {
  if(this.params.expires){
    var hours = this.params.expires.match(/(\d)h/);
    if(hours !== null){
      return parseInt(hours[1], 10) * 3600 * 1000;
    }

    var days = this.params.expires.match(/(\d)d/);
    if(days !== null){
      return (parseInt(days[1], 10) * 24) * 3600 * 1000;
    }
  }
  // default to 5 hours
  return 5 * 3600 * 1000;
};


FeedFetcher.prototype.fetchFromSource = function () {
  var fetcher = this;
  this.logger.warn('Fetching', {name: this.params.name});
  async.forEachSeries(fetcher.feedList, function(url, next) {
    fetcher.logger.warn('Parsing', {url: url});
    feedparser.parseUrl(url).on('complete', fetcher.incomingArticlesHandler.bind(fetcher, next));
  });
};


FeedFetcher.prototype.incomingArticlesHandler = function(nextFeed, meta, articles) {
  var fetcher = this;
  articles.sort(function(article1, article2) {
    return Date.parse(article1.date) - Date.parse(article2.date);
  });
  this.newArticlesCount = 0;

  async.forEachSeries(articles, this.pushArticle.bind(this), function() {
    fetcher.logger.warn('New articles added', {
      title: meta.title,
      url: meta.link,
      newArticles: fetcher.newArticlesCount
    })
    nextFeed();
  });
};


FeedFetcher.prototype.pushArticle = function(article, nextArticle) {
  var fetcher = this;
  if(!fetcher.isDuplicate(article) && !fetcher.isStale(article.date)){
    this.logger.info('Adding article', {
      title: article.title,
      articleDate: ''+article.date
    });
    fetcher.newArticlesCount++;
    fetcher.existingArticles.push(article);
    fetcher.redisClient.lpush(fetcher.name, JSON.stringify(article), function(err, replies) {
      nextArticle();
      if(err !== null){
        fetcher.emit('insertionError', err, article);
      }
    });
  } else {
    nextArticle();
  }
};


FeedFetcher.prototype.isStale = function(rawDate) {
  var date = Date.parse(rawDate),
      now = new Date(),
      offset = new Date(now.getTime() - this.expires);
  return date < offset;
};


FeedFetcher.prototype.isDuplicate = function(article) {
  for(var i=0; i<this.existingArticles.length; i++){
    if(this.existingArticles[i].title === article.title ||
       this.existingArticles[i].guid === article.guid
      ){
      return true;
    }
  }
  return false;
};


FeedFetcher.prototype.fetchArticles = function() {
  if(this.existingArticles && this.existingArticles.length > 0){
    this.emit('storedArticles', this.params.instanceId, this.existingArticles);
  } else {
    this.fetchStoredArticles();
  }
};


FeedFetcher.prototype.fetchStoredArticles = function() {
  var fetcher = this;
  fetcher.redisClient.llen(fetcher.name, function(err, len) {
    if(err){ return fetcher.emit('storedArticleError', err); }

    fetcher.redisClient.lrange(fetcher.name, 0, len, function(err, replies) {
      if(err){ return fetcher.emit('storedArticleError', err); }

      var parsedReplies = [];
      replies.forEach(function(reply) {
        parsedReplies.push(JSON.parse(reply));
      });

      if(fetcher.existingArticles === null){
        fetcher.existingArticles = parsedReplies;
      }
      fetcher.emit('storedArticles', fetcher.params.instanceId, parsedReplies);
    });
  });
};


FeedFetcher.prototype.cleanupOldArticles = function(instanceId, articles) {
  var fetcher = this;
  async.forEachSeries(articles, function(article, nextArticle) {
    if(fetcher.isStale(article.date)){
      fetcher.redisClient.rpop(fetcher.name, function(err, removed) {
        nextArticle();
      });
    } else {
      nextArticle();
    }
  }, function() {
    fetcher.emit('cleanupFinished');
  });
};


FeedFetcher.prototype.getFeedMetadata = function () {
  return this.params.data;
};


module.exports = {
  createFetcher: function(params) {
    return new FeedFetcher(params);
  }
};