var util = require('util'),
    _ = require('underscore');

module.exports = function(logger) {
  return function () {
    try {
      var response = JSON.parse(this.req.body.data);
    } catch(err){
      console.log("error parsing data");
      this.res.writeHead(502);
      this.res.end("error parsing data");
    }

    var terms = [];
    response.items.forEach(function(val) {
      var extractedTerms = val['loop:termextraction'],
          extractedTermsList = (!util.isArray(extractedTerms)) ? [extractedTerms] : extractedTerms;
      extractedTermsList.forEach(function(innerval) {
        if(innerval && innerval.content && val.guid && val.guid.content){
          terms.push({
            content: innerval.content,
            id: val.guid.content
          });
        }
      });
    });

    var indexesForRemoval = [];
    response.items.forEach(function(val, idx) {
      var extractedTerms = val['loop:termextraction'],
          extractedTermsList = (!util.isArray(extractedTerms)) ? [extractedTerms] : extractedTerms;
          hits = 0,
          hitTerms = [];

      for(var i=0; i<extractedTermsList.length; i++){
        if(extractedTermsList[i] && extractedTermsList[i].content){

          terms.forEach(function(term) {
            if(term.content === extractedTermsList[i].content &&
               val.guid && val.guid.content && val.guid.content !== term.id
              ){
              hits++;
              hitTerms.push(extractedTermsList[i].content);
            }
          });
        }
      }

      hitTerms = _.uniq(hitTerms);

      if(hits > 1){
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
  };
};
