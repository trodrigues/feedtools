var scraper = require('./scraper').createScraper();

function scrapeContent(url, window, $) {
  if(/^http(s)?:\/\/.*wired\.com/g.test(url)){
    return $('.post .entry').html();
  }

  if(/^http(s)?:\/\/.*(publico.pt|PublicoRSS)/g.test(url)){
    return $('#content').html();
  }
}

module.exports = function(logger) {
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

    scraper.on('fetched', function(index, url, window, $) {
      logger.info('scraping '+url);
      items[index]['content:scraped'] = scrapeContent(url, window, $);
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
