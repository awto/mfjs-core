var M = require('../index');

var idDef = new M.MonadDict();
idDef.pure = idDef.coerce = function(a) { return a; };
idDef.bind = function(a, f) { return f(a); };
idDef.repeat = function(f, a) {
  for(var n = a;!n || n.constructor !== this.Unwind;n = f(n));
  return n;
};
idDef.forPar = function(test, body, upd, arg) {
  while(test(arg)) {
    res = body(arg);
    if (res && res.constructor === this.Unwind)
      return res;
    arg = upd(arg)
  }
  return arg;
};

idDef.run = function(f) { return f(); };

function IdM(inner) {
  this.inner = inner;
}

var Id = M.addContext(M.wrap(M.withControlByToken(idDef), IdM));
M.completePrototype(Id,IdM.prototype);

var Kit = require('./kit/dist/noeff');
Kit(M,function(txt,f) {
  it(txt, function() {
    Id.run(function() {
      return f(Kit.defaultItArgs(Id));
    })
  });
});


