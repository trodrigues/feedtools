var flatiron = require('flatiron'),
    util = require('util'),
    app = flatiron.app;

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', function () {
  try {
    var response = JSON.parse(this.req.body.data);
  } catch(err){
    console.log("error parsing data");
    this.res.writeHead(502);
    this.res.end("error parsing data");
  }

  var terms = [];
  console.log(util.inspect(response.items));
  response.items.forEach(function(val, idx) {
    var extractedTerms = val['loop:termextraction'];
    extractedTerms.forEach(function(val, idx) {
      terms.push(val.content);
    });
  });

  var indexesForRemoval = [];
  response.items.forEach(function(val, idx) {
    var extractedTerms = val['loop:termextraction'],
        hits = 0,
        hitTerms = [];
    for(var i=0; i<extractedTerms.length; i++){
      if(terms.indexOf(extractedTerms[i].content) > -1){
        hits++;
        hitTerms.push(extractedTerms[i].content);
      }
    }

    if(hits > 0){
      indexesForRemoval.push(idx);
      console.log('> Removing items with:');
      console.log('Title: '+val.title);
      console.log('Link: '+val.link);
      console.log('Terms: '+util.inspect(hitTerms));
    }
  });

  indexesForRemoval.forEach(function(val, idx) {
    response.items.splice(val, 1);
  });

  console.log("Parsed request. Removed "+indexesForRemoval.length+" items.\n\n");

  this.res.writeHead(200, { 'Content-Type': 'application/json' });
  this.res.end(JSON.stringify({items: response.items}));
});

app.start(3040);
