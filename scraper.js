var exec = require('child_process').exec,
    fs = require('fs'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2;

var THROTTLE_TIME = 1000;

var isUrl = /^http(s)?:\/\/.*/g;

function getGuidLink(item) {
  var url;

  if(item){
    if(item['feedburner:origLink']){
      url = item['feedburner:origLink'];
      if(isUrl.test(url)){ return url; }
    }

    if(item.guid && item.guid.content){
      url = item.guid.content;
      if(isUrl.test(url)){ return url; }
    }
  }
  return item.link;
}

function Scraper(logger) {
  this.logger = logger;
}
util.inherits(Scraper, EventEmitter2);

Scraper.prototype.scrape = function(url, index) {
  var waitTime = THROTTLE_TIME * index;
  setTimeout(function(url, index) {
    var self = this,
        url = url,
        index = index;

    this.logger.info('scraping url '+ index +': '+url);
    exec('phantomjs phantom.js "'+ url +'"', function(error, stdout, stderr) {
      if(error === null && stdout.length > 0){
        self.emit('fetched', index, url, stdout);
      } else {
        self.emit('fetchError', index, url, {
          stderr: stderr,
          stdout: stdout,
          error: error
        });
      }
    });
  }.bind(this, url, index), waitTime);

};


Scraper.prototype.parseItemList = function(items) {
  var self = this;
  this.fetchCounter = 0;
  var itemsLength = items.length;

  this.on('fetched', this.handleFetchCount.bind(this, itemsLength));
  this.on('fetchError', this.handleFetchCount.bind(this, itemsLength));

  for(var i=0; i<itemsLength; i++){
    this.scrape(getGuidLink(items[i]), i);
  }
};


Scraper.prototype.handleFetchCount = function(itemsLength) {
  this.fetchCounter++;
  console.log('fetched', this.fetchCounter, itemsLength);
  if(this.fetchCounter === itemsLength){
    this.emit('allFetched');
  }
};


module.exports = {
  createScraper: function(logger) {
    return new Scraper(logger);
  }
};
