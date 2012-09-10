var page = new WebPage();

var url = require('system').args[1];

page.open(url, function(status) {
  if(status == 'success'){
    var content = page.evaluate(function(url) {

      function scrapeContent(url, document) {
        if(/^http(s)?:\/\/.*wired\.com/g.test(url)){
          return document.querySelectorAll('.post .entry')[0].innerHTML;
        }

        if(/^http(s)?:\/\/.*(publico.pt|PublicoRSS)/g.test(url)){
          var content = document.getElementById('content');
          if(content){
            return content.innerHTML;
          }
        }

        throw new Error('Error: '+url+' not parsed');
      }

      try{
        return scrapeContent(url, document);
      } catch(err){
        return err.message;
      }
    }, url);
    
    if(content.indexOf('Error:') === 0){
      console.log(content);
      phantom.exit(1);
    }
    console.log(content);
    phantom.exit(0);
  } else {
    console.log(status);
    phantom.exit(1);
  }
});
