var M = require('../index'), 
  idDef = require('./kit/iddef');

function IdM(inner) {
  this.inner = inner;
}

var Id = M.defaults(idDef,{wrap: IdM});
// M.completePrototype(Id,IdM.prototype);

var Kit = require('./kit/dist/noeff');
Kit(M,function(txt,f) {
  it(txt, function() {
    Id.run(function() {
      return f(Kit.defaultItArgs(Id));
    });
  });
});


