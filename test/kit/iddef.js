var M = require('../../index');

var idDef = {
  pure: function(a) { return a; },
  coerce: function(a) { return a; },
  bind: function(a, f) { return f(a); },
  repeat: function(f, a) {
    for(var n = a;!n || !n.unwindToken;n = f(n));
    return n;
  },
  forPar: function(test, body, upd, arg) {
    while(test(arg)) {
      res = body(arg);
      if (res && res.unwindToken)
        return res;
      arg = upd(arg);
    }
    return arg;
  },
  run: function(f) { return f(); }
};

module.exports = M.addControlByToken(M.completeMonad(idDef));

