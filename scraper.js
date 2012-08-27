var jsdom = require('jsdom'),
    fs = require('fs'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    jquery = fs.readFileSync(__dirname+'/jquery-1.7.2.js').toString();

function Scraper() {
}
util.inherits(Scraper, EventEmitter2);

Scraper.prototype.dom = function(url) {
  var self = this;
  jsdom.env({
    html: url,
    src: [
      jquery
    ], 
    done: function(errors, window) {
      if(errors){
        self.emit('fetchError', url, errors);
      } else {
        self.emit('fetched', url, window, window.$);
      }
    }
  });
};


Scraper.prototype.parseItemList = function(items) {
  var self = this;
  this.fetchCounter = 0;
  var itemsLength = items.length;

  this.on('fetched', handleFetchCount);
  this.on('fetchError', handleFetchCount);

  for(var i=0; i<itemsLength; i++){
    this.dom(items.link);
  }
};


Scraper.prototype.handleFetchCount = function() {
  this.fetchCounter++;
  if(this.fetchCounter === itemsLength){
    this.emit('allFetched');
  }
};


module.exports = {
  createScraper: function() {
    return new Scraper();
  }
};
