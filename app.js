var flatiron = require('flatiron'),
    app = flatiron.app;

app.use(flatiron.plugins.http);

app.router.post('/filter/repeatedkeywords', function (data) {
  var response = data;

  console.log(data);

  this.res.writeHead(200, { 'Content-Type': 'application/json' });
  this.res.end(response);
});

app.start(3040);
