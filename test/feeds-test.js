var buster = require('buster');
var sinon = require('sinon');

var feedGroups = {
  "guardiansports": {
    "title": "Guardian sports",
    "description": "Guardian sports",
    "feed_url": "http://feeds.url.com/rss/guardian-sports",
    "site_url": "http://guardian.co.uk",
    "image": "http://image.guardian.co.uk/sitecrumbs/Guardian.gif",
    "author": "",
    "feeds": [
      "http://www.guardian.co.uk/sport/cycling/rss",
      "http://www.guardian.co.uk/sport/formula-one-2012/rss"
    ]
  },
  "guardiantech": {
    "title": "Guardian tech",
    "description": "Guardian tech",
    "feed_url": "http://feeds.url.com/rss/guardian-tech",
    "site_url": "http://guardian.co.uk",
    "image": "http://image.guardian.co.uk/sitecrumbs/Guardian.gif",
    "author": "",
    "feeds": [
      "http://feeds.guardian.co.uk/theguardian/technology/rss",
      "http://feeds.guardian.co.uk/theguardian/science/rss"
    ]
  }
};

var feeds;

buster.testCase("Feeds module", {
  setUp: function() {
    var feedFetcher = require('../feeds/feedFetcher');
    this.createFetcherStub = sinon.stub(feedFetcher, 'createFetcher');

    feeds = require('../feeds/feeds');
  },

  "initialization with no params": {
    setUp: function() {
      this.feeds = feeds.createFeeds({});
    },

    "creates a feeds instance": function() {
      assert.isObject(this.feeds);
    },

    "sets up a default fetchInterval": function() {
      assert.equals(this.feeds.params.fetchInterval, 3600000);
    },
  },

  "initialization with a feed group": {
    setUp: function() {
      this.onStub = sinon.stub();
      this.createFetcherStub.returns({
        on: this.onStub
      });
      this.feeds = feeds.createFeeds({
        feedGroups: feedGroups
      });
    },

    "creates the correct number of fetchers": function() {
      assert.equals(this.feeds.fetchers.length, 2);
    },

    "fetchers were created with the needed parameters": function() {
      assert.calledWith(this.createFetcherStub, {
        name: 'guardiansports',
        logger: this.feeds.logger,
        data: feedGroups.guardiansports,
        redisClient: this.feeds.redisClient,
        instanceId: 0
      });
    },

    "right number of events were set for each of the feedgroups": function() {
      assert.equals(this.onStub.callCount, 6);
      assert.calledWith(this.onStub, 'ready');
      assert.calledWith(this.onStub, 'insertionError');
      assert.calledWith(this.onStub, 'storedArticleError');
    }
  },

  tearDown: function() {
    this.createFetcherStub.restore();
  }
})