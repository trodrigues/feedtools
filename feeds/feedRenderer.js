var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    RSS = require('rss');

function FeedRenderer(params) {
  this.params = params;

  this.feed = new RSS(params.fetcher.getFeedMetadata());
}
util.inherits(FeedRenderer, EventEmitter2);

FeedRenderer.prototype.render = function (params, postRender) {
  var self = this;
  this.params.fetcher.once('storedArticles', function(fetcherId, articles) {
    articles.forEach(function(value) {
      self.feed.item({
        title: value.title,
        description: value.description,
        url: value.link,
        guid: value.guid,
        author: value.author,
        categories: value.categories,
        date: value.date
      });
    });
    postRender(params.format == 'xml' ? self.feed.xml() : JSON.stringify(self.feed));
  });

  this.params.fetcher.fetchStoredArticles();
};

module.exports = {
  createRenderer: function(params) {
    return new FeedRenderer(params);
  }
};