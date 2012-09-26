var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    FeedParser = require('FeedParser');

function FeedFetcher(list) {
  this.parser = new FeedParser();

  this.parser.on('article', function(article) {
    console.log(article);
  });

  console.log('fetching from', list[0]);
  this.parser.parseUrl(list[0]);
}
util.inherits(FeedFetcher, EventEmitter2);

module.exports = {
  createFetcher: function(list) {
    return new FeedFetcher(list);
  }
};