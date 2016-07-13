var M = require('../../index');

var defs = {
  pure: function(a) { return a; },
  coerce: function(a) { return a; },
  bind: function(a, f) { return f(a); },
  run: function(f) { return f(); }
};

defs = M.addControlByToken(M.completeMonad(defs));
defs.forPar = function(test, body, upd, arg) {
  while(test(arg)) {
    res = body(arg);
    if (res && res.unwindToken)
      return res;
    arg = upd(arg);
  }
  return arg;
};
defs.repeat = function(f, a) {
  for(var n = a;!n || !n.unwindToken;n = f(n));
  return n;
}

module.exports = defs.cloneDefs();



