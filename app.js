var flatiron = require('flatiron'),
    app = flatiron.app;

app.use(flatiron.plugins.http);

app.router.get('/', function (data) {
  this.res.writeHead(200, { 'Content-Type': 'text/plain' });
  this.res.end('Hello. I have nothing for you. Goodbye.');
});

app.router.post('/filter/repeatedkeywords', function (data) {
  var response = data;

  console.log(data);

  this.res.writeHead(200, { 'Content-Type': 'application/json' });
  this.res.end(response);
});

app.start(3040);
