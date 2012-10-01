var RSS = require('rss');

function FeedRenderer(params) {
}
util.inherits(FeedFetcher, EventEmitter2);

FeedFetcher.prototype.parseList = function () {
};

module.exports = {
  createRenderer: function(params) {
    return new FeedRenderer(params);
  }
};