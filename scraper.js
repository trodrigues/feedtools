var jsdom = require('jsdom'),
    fs = require('fs'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    jquery = fs.readFileSync(__dirname+'/jquery-1.7.2.js').toString();

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

function Scraper() {
}
util.inherits(Scraper, EventEmitter2);

Scraper.prototype.dom = function(url, index) {
  var self = this;
  var waitTime = THROTTLE_TIME * index;
  setTimeout(function() {
    jsdom.env({
      html: url,
      src: [
        jquery
      ], 
      done: function(errors, window) {
        if(errors){
          self.emit('fetchError', index, url, errors);
        } else {
          self.emit('fetched', index, url, window, window.$);
        }
      }
    });
  }, waitTime);
};


Scraper.prototype.parseItemList = function(items) {
  var self = this;
  this.fetchCounter = 0;
  var itemsLength = items.length;

  this.on('fetched', this.handleFetchCount.bind(this, itemsLength));
  this.on('fetchError', this.handleFetchCount.bind(this, itemsLength));

  for(var i=0; i<itemsLength; i++){
    this.dom(getGuidLink(items[i]), i);
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
  createScraper: function() {
    return new Scraper();
  }
};
