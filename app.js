var flatiron = require('flatiron'),
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
  response.items.forEach(function(val, idx) {
    terms.push(val['loop:termextraction']);
  });

  var indexesForRemoval = [];
  response.items.forEach(function(val, idx) {
    if(terms.indexOf(val['loop:termextraction']) > -1){
      indexesForRemoval.push(idx);
      console.log('> Removing items with:');
      console.log('Title: '+val.title);
      console.log('Link: '+val.link);
      console.log('Terms: '+val['loop:termextraction']);
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
