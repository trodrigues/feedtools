#!/usr/bin/env node

var scraper = require('./Scraper').createScraper();

scraper.on('fetched', function(index, url, window, $) {
  console.log($('body').html());
});

scraper.dom('http://feeds.wired.com/~r/wired/index/~3/onYkLIy-qgw/');
