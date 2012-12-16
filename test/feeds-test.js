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

var loggerStub = {
  info: function() {},
  warn: function() {}
};

buster.testCase("Feeds module", {
  setUp: function() {
    var feedFetcher = require('../feeds/feedFetcher');
    var feedRenderer = require('../feeds/feedRenderer');
    this.createFetcherStub = sinon.stub(feedFetcher, 'createFetcher');
    this.createRendererStub = sinon.stub(feedRenderer, 'createRenderer');

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

  "request handler creation": {
    setUp: function() {
      this.createRendererStub.returns({});
      this.fetchStub = sinon.stub();
      this.createRouteStub = sinon.stub();

      this.feeds = feeds.createFeeds({
        createRoute: this.createRouteStub,
        fetchInterval: 0,
        logger: loggerStub
      });
      this.feeds.fetchers = [
        {name: 'guardiansports', fetchFromSource: this.fetchStub},
        {name: 'guardiantech', fetchFromSource: this.fetchStub}
      ];
      this.feedHandlerStub = sinon.stub(this.feeds, 'makeFeedHandler');
      this.feedHandlerStub.returns({});
      this.terminateStub = sinon.stub(this.feeds, 'terminateFetching');
      this.feeds.readyHandler(0);
    },

    "renderers are created": function() {
      this.feeds.readyHandler(1);
      assert.equals(this.feeds.renderers.length, 2);
    },

    "routes are created": function() {
      assert.calledWith(this.createRouteStub, '/rss/guardiansports', {});
      assert.calledWith(this.feedHandlerStub, 0);
    },

    "data is fetched and fetching is terminated": function() {
      assert.called(this.fetchStub);
      assert.called(this.terminateStub);
    }
  },

  "request handler usage": {
    setUp: function() {
      this.renderStub = sinon.stub();
      this.renderStub.callsArgWith(1, 'renderedfeed');
      this.writeHeadStub = sinon.stub();
      this.endStub = sinon.stub();

      this.feeds = feeds.createFeeds({logger: loggerStub});
      this.feeds.renderers = [
        {render: this.renderStub}
      ];

      this.handlerContext = {
        req: {
          query: {}
        },
        res: {
          writeHead: this.writeHeadStub,
          end: this.endStub
        }
      };
      this.feedHandler = this.feeds.makeFeedHandler(0);
      this.feedHandler.call(this.handlerContext);
    },

    "feed handler is returned": function() {
      assert.isFunction(this.feedHandler);
    },

    "write head is called": function() {
      assert.called(this.writeHeadStub);
    },

    "end is called with content": function() {
      assert.calledWith(this.endStub, "renderedfeed");
    },
  },

  tearDown: function() {
    this.createFetcherStub.restore();
    this.createRendererStub.restore();
  }
})