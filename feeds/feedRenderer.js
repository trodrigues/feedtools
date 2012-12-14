var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    RSS = require('rss');

function FeedRenderer(params) {
  this.params = params;
  this.logger = params.logger;
}
util.inherits(FeedRenderer, EventEmitter2);

FeedRenderer.prototype.render = function (params, postRender) {
  var self = this;
  var feed = new RSS(this.params.fetcher.getFeedMetadata());
  this.params.fetcher.once('storedArticles', function(fetcherId, articles) {
    articles.forEach(function(value) {
      feed.item({
        title: value.title,
        description: value.description,
        url: value.link,
        guid: value.guid,
        author: value.author,
        categories: value.categories,
        date: value.date
      });
    });
    postRender(params.format == 'xml' ? feed.xml() : JSON.stringify(feed));
  });

  this.params.fetcher.fetchArticles();
};

module.exports = {
  createRenderer: function(params) {
    return new FeedRenderer(params);
  }
};