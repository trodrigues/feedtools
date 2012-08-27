var scraperUtils = require('./scraperUtils');

module.exports = function(logger) {
  return function() {
    try {
      var response = JSON.parse(this.req.body.data);
    } catch(err){
      logger.error("error parsing data");
      this.res.writeHead(502);
      this.res.end("error parsing data");
    }

  };
};
