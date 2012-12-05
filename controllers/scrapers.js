module.exports = function(logger) {
  var scraper = require('./scraper').createScraper(logger);

  return function() {
    var self = this;

    try {
      var response = JSON.parse(this.req.body);
    } catch(err){
      logger.error("error parsing data", {err: err});
      this.res.writeHead(502);
      this.res.end("error parsing data");
    }

    var items = response.data.value.items;

    logger.info('Scraping '+items.length+' items');

    scraper.on('fetched', function(index, url, scrapedContent) {
      if(scrapedContent.indexOf('Error:') === 0){
        logger.error(scrapedContent);
      } else {
        items[index]['content:scraped'] = scrapedContent;
      }
    });

    scraper.on('fetchError', function(index, url, errors) {
      logger.error('Error scraping', {
        url: url,
        errors: errors
      });
    });

    scraper.on('allFetched', function() {
      self.res.writeHead(200, { 'Content-Type': 'application/json' });
      self.res.end(JSON.stringify({items: items}));
    });

    scraper.parseItemList(items);
  };
};
