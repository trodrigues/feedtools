#!/usr/bin/env node
var request = require('request'),
    util = require('util'),
    fs = require('fs');

//request('http://pipes.yahoo.com/pipes/pipe.run?_id=c07cfbb832abae3d815b0cb62f3f6070&_render=json', function(error, response, body) {
request('http://pipes.yahoo.com/pipes/pipe.run?_id=jtJEtdKi3RGNZTyppgt1Yg&_render=json', function(error, response, body) {
  console.log('got json, lets scrape');
  if (!error && response.statusCode == 200) {
    request.post({url: 'http://127.0.0.1:3040/scraper', timeout: 100000, json: '{"data": '+body+'}'}, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        fs.writeFile('response.json', util.inspect(body));
        console.log('done');
      } else {
        console.log('fail', response);
      }
    })
  }
});

