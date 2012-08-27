var scraper = require('./scraper').createScraper();

function scrapeContent(url, window, $) {
}

module.exports = function(logger) {
  return function() {
    var self = this;
    try {
      var response = JSON.parse(this.req.body.data);
    } catch(err){
      logger.error("error parsing data");
      this.res.writeHead(502);
      this.res.end("error parsing data");
    }

    scraper.on('fetched', function(index, url, window, $) {
      response.items[index]['content:scraped'] = scrapeContent(url, window, $);
    });

    scraper.on('allFetched', function() {
      self.res.writeHead(200, { 'Content-Type': 'application/json' });
      self.res.end(JSON.stringify({items: response.items}));
    });

    scraper.parseItemList(response.items);
  };
};
