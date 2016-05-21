var M = require('../index'), 
    idDef = require('./kit/iddef');

var Id = M.wrapGlobal(idDef);
var Kit = require('./kit/dist/noeff');
M.setContext(Id);

describe('using global wrapper', function() {
  Kit(M,function(txt,f) {
    it(txt, function() {
      Id.run(function() {
        return f(Kit.defaultItArgs(Id));
      });
    });
  });
});

