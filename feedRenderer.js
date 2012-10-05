var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    RSS = require('rss');

function FeedRenderer(params) {
  this.params = params;

  /*
  this.feed = new RSS({
    // TODO get this data on the fetcher from the source url
    title: 'title',
    description: 'description',
    feed_url: 'http://example.com/rss.xml',
    site_url: 'http://example.com',
    image_url: 'http://example.com/icon.png',
    author: 'Dylan Greene'
  });
*/
}
util.inherits(FeedRenderer, EventEmitter2);

FeedRenderer.prototype.render = function () {
  console.log('rendering');
  this.params.fetcher.once('storedArticles', function(fetcherId, articles) {
    articles.forEach(function(value) {
      console.log('renderer', value);
      /*
      this.feed.item({
        title:  'item title',
        description: 'use this for the content. It can include html.',
        url: 'http://example.com/article4?this&that', // link to the item
        guid: '1123', // optional - defaults to url
        author: 'Guest Author', // optional - defaults to feed author property
        date: 'May 27, 2012' // any format that js Date can parse.
      });
*/

      // TODO send out http response with this.feed.xml()
    }, this);
  }.bind(this));

  this.params.fetcher.fetchStoredArticles();
};

module.exports = {
  createRenderer: function(params) {
    return new FeedRenderer(params);
  }
};