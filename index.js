/**
 * # Abstract runtime library for mfjs compiler
 *
 * The doc assumes name `M` is used for namespace of the module.
 * 
 *     var M = require('@mfjs/core');
 */

'use strict';
var context;

/**
 * Coerces argument value to current Monad.
 * 
 * Coercsion in general is monad specific, but by default this means checking if
 * the value already has current monad type it is simply returned, or otherwise 
 * `M.pure(v)` is returned.
 *
 * @namespace
 * @param {MonadVal|Any} v 
 * @return {MonadVal}
 */
function M(v) {
  return context.coerce(v);
}

module.exports = M;

/**
 * Returns simple iterator for `for-in` statement implementation.
 * 
 * It is not ES compatible, because ES iterator is mutable. This doesn't fit
 * well in monadic framework. 
 * @see M.iteratorBuf for iterator interface description
 * @function M.forInIterator
 * @param {Object} args
 * @return {Iterator}
 */
M.forInIterator = function(obj) {
  var arr = [];
  for (var i in obj)
    arr.push(i);
  return arrayIterator(arr);
};

/**
 * Adapts interface from ES iterators to mfjs compatible. The resulting 
 * iterator still uses ES mutable one, so each step invalidates previous
 * iterator. `M.iteratorBuf` may be used to make immutable one.
 * 
 * @see M.iteratorBuf for iterator interface description
 * @function M.iterator
 * @param {Any} arg iterable value (has `Symbol.iterator` method)
 * @return {Iterator}
 */
M.iterator = function(arg) {
  var cur = arg[Symbol.iterator]();
  function iter() {
    var val = cur.next();
    if (val.done)
      return null;
    var res = function() { return iter(); };
    res.value = val.value;
    return res;
  };
  return iter();
};

function isArrayLike( obj ) {
  if (Array.isArray(obj))
    return false;
	if (typeof obj === "function")
		return false;
	var length = !!obj && "length" in obj && obj.length;
	return length === 0 ||
		typeof length === "number" && length > 0 && (length - 1) in obj;
}

/** 
 * Returns immutable mfjs iterator from iterable value. It buffers passed values
 * allowing to return back to some position. There is a special implementation 
 * for arrays without buffering.
 *
 * The returned iterator is a function, calling it either
 * returns null if there are no other values or another function for next 
 * value with current value in field `value`. There returned iterator is 
 * immediately focused on the first element (so the function may return null) 
 * if input collection is empty.
 * @function M.iteratorBuf
 * @param {Any} arg iterable value (has `Symbol.iterator` method)
 * @return {Iterator}
 */
M.iteratorBuf = function(arg) {
  var buf, cur, done;
  if (isArrayLike(arg))
    return arrayIterator(arg);
  buf = [], cur = arg[Symbol.iterator]();
  function iter(pos) {
    var val, nxt, res = function() { return iter(pos+1); };
    if (done)
      return null;
    if (buf.length > pos) {
      res.value = buf[pos];
    } else {
      nxt = cur.next();
      if (nxt.done) {
        done = true;
        return null;
      }
      buf.push(res.value = nxt.value);
    }
    return res;
  }
  return iter(0);
};

function arrayIterator(arr) {
  function iter(cur) {
    if (cur >= arr.length) 
      return null;
    var res = function() {
      return iter(cur + 1);
    };
    res.value = arr[cur];
    return res;
  }
  return iter(0);
}

/**
 * Simply copies all definitions from one definition to another.
 *
 * If a few monad definitions are used in a program it is worth 
 * they are cloned first to get same hidden class. 
 * @function M.cloneDefs
 * @param {MonadDict} initial definitions
 * @return {MonadDict} complete definition
 */
M.cloneDefs = cloneDefs;
function cloneDefs(from, defs) {
  var fcoerce, i;
  if (!from)
    from = this;
  fcoerce = from.coerce;
  if (!defs)
    defs = fcoerce ? function(v) { return fcoerce(v); } : {};
  cloneBasic(from,defs);
  defs.bind = from.bind;
  defs.block = from.block;
  defs.scope = from.scope;
  defs.map = from.map;
  defs.handle = from.handle;
  defs["finally"] = from["finally"];
  defs.pair = from.pair;
  defs.arr = from.arr;
  defs.empty = from.empty;
  defs.alt = from.alt;
  defs.opt = from.opt;
  defs.plus = from.plus;
  defs.repeat = from.repeat;
  defs.forPar = from.forPar;
  defs.pack = from.pack;
  defs.unpack = from.unpack;
  defs.run = from.run;
  defs.exec = from.exec;
  defs.reflect = from.reflect;
  defs.reify = from.reify;
  defs["const"] = from["const"];
  defs.unshiftTo = from.unshiftTo;
  defs.cloneDefs = from.cloneDefs;
  defs.addCoerce = from.addCoerce;
  defs.addContext = from.addContext;
  defs.seq = from.seq;
  return defs;
}

function cloneBasic(from, defs) {
  defs.coerce = from.coerce;
  defs.pure = from.pure;
  defs.raise = from.raise;
  defs.arr = from.arr;
  defs.empty = from.empty;
  defs.alt = from.alt;
  defs.opt = from.opt;
  defs.plus = from.plus;
  defs.pack = from.pack;
  defs.unpack = from.unpack;
}

/**
 * Adds not implemented methods for monad definition object
 * @function M.completeMonad
 * @param {MonadDict} initial definitions
 * @return {MonadDict} complete definition
 */
M.completeMonad = completeMonad;
function completeMonad(defs, opts) {
  var pure = defs.pure,
      bind = defs.bind,
      map = defs.map,
      coerce = defs.coerce,
      join = defs.join,
      pair = defs.pair,
      arr = defs.arr,
      alt = defs.alt,
      plus = defs.plus,
      empty = defs.empty,
      mconst = defs["const"],
      unshiftTo = defs.unshiftTo,
      seq = defs.seq,
      run = defs.run,
      handle = defs.handle,
      raise = defs.raise
  ;
  if (!pure)
    throw new Error("pure function must defined");
  if (!coerce)
    coerce = defs.coerce = function coerce(v) { return v; };
  if (!defs.cloneDefs)
    defs.cloneDefs = cloneDefs;
  if (!bind) {
    if (join && map)
      bind = defs.bind = function bind(a, f) { return join(map(a,f)); }
    else
      bind = defs.bind = function bind(a, f) { return a.mbind(f); }
  }
  if (!map) {
    if (bind)
      map = defs.map = function map(a, f) {
        return bind(a, function mapCont(v) { return pure(f(v)); });
      };
    else
      map = defs.map = function map(a, f) { return a.mapply(f); };
  }
  if (!join)
    join = defs.join = function join(m) {
      return bind(m, function joinCont(v) { return v; });
    }
  if (!pair) {
    if (arr)
      pair = defs.pair = function pair(a,b) {
        return arr([a,b]);
      };
    else
      pair = defs.pair = function pair(a,b) {
        return bind(a, function(av) {
          return map(b, function(bv) {
            return [av, bv];
          });
        });
      };
  }
  if (!arr)
    defs.arr = arr = function arr(v) {
      switch (v.length) {
      case 0:
        return pure([]);
      case 1:
        return map(v[0], function(v) {
          return [v];
        });
      case 2:
        return pair(v[0], v[1]);
      default:
        return map(pair(v[0], v(v.slice(1))), function arrIter(arg1) {
          return [arg1[0]].concat(arg1[1]);
        });
      }
    };
  if (!defs.repeat)
    defs.repeat = function repeat(body, arg) {
      function iter(arg) {
        return bind(body(arg), iter);
      };
      return iter(arg);
    };
  if (!defs.forPar)
    defs.forPar = function forPar(test, body, upd, arg) {
      function forParBody(arg) {
        if (test(arg)) {
          return bind(body(arg), function forParUpd() {
            return forParBody(upd(arg));
          });
        } else {
          return pure(arg);
        }
      }
      return forParBody(arg, null);
    };
  
  if (!defs.reify)
    defs.reify = function reify(v) { return v(); };
  if (!defs.reflect)
    defs.reflect = function reflect(m) { return m; };
  if (!run)
    run = defs.run = defs.reify;
  if (!defs["finally"])
    defs["finally"] = function _finally(a, f) {
      return bind(handle(a, function finnalyError(e) {
        return bind(f(), function finallyCont() {
          return raise(e);
        });
      }), function(v) {
        return mconst(f(), v);
      });
    };
  if (!alt) {
    if (plus && empty)
      alt = defs.alt = function alt() {
        var i, j, len, cur;
        //TODO: maybe balance it
        if (!arguments.length)
          return empty();
        cur = arguments[0];
        for (j = 1, len = arguments.length; j < len; j++) {
          i = arguments[j];
          cur = plus(cur, i);
        }
        return cur;
      };
  }
  if (!empty && alt)
    defs.empty = function empty() { return alt(); };
  if (!plus && alt)
    plus = defs.plus = function plus(a, b) { return alt(a, b); };
  if (!defs.opt && plus)
    defs.opt = function opt(v) { return plus(v, pure()); }
  if (!mconst)
    mconst = defs["const"] = function _const(a,arg) {
      return map(a, function() { return arg; });
    };
  if (!unshiftTo)
    unshiftTo = defs.unshiftTo = function unshiftTo(a, arg) {
        return map(a, function(v) {
          arg.push(v);
          return arg;
        });
    };
  if (!defs.unpack)
    defs.unpack = function unpack(v) { return v; };
  if (!defs.pack)
    defs.pack = function pack(v) { return v; };
  if (!seq) {
    seq = defs.seq = function(f) {
      var i = f();
      function walk(v) {
        var n = i.next(v);
        return n.done ? pure(v) : bind(n.value, walk);
      }
      return walk();
    }
  }
  if (!defs.runSeq)
    defs.runSeq = function(f) {
      return run(function() { return seq(f()); });
    }
  if (!defs.scope && defs.block)
    defs.scope = defs.block;
  return defs;
}

/**
 * Short equivalent to: `(a,arg) => M.map(a, () => arg)`, but some 
 * implementations may override it to implement something more effective.
 * 
 * Default implementation uses `map`.
 * @function MonadDict.const
 * @param {MonadVal} a value to map to
 * @param {Any} arg value to use in result instead
 * @return {MonadVal}
 */
M["const"] = function(a, arg) { return context["const"](a,arg); }

/**
 * Short equivalent to: `(a,arg) => M.map(a, (v) => arg.unshift(v), arg)`
 * 
 * Default implementation uses `map`
 * @function MonadDict.unshiftTo
 * @param {MonadVal} a
 * @param {Array} arg
 * @return {MonadVal}
 */
M.unshiftTo = function(a, arg) { return context.unshiftTo(a,arg); }

/**
* For wrapped monadic values with will return value stored in it.
* 
* @function MonadDict.unpack
* @param {MonadVal} v
* @return {MonadVal}
*/
M.unpack = function(v) { return context.unpack(v); };

/** 
 * Function to call at top level to get final result.
 * @function M.run
 * @param {MonadDict} defs definitions for monad to run
 * @param {Function} fun function to be executed inside monad context `defs` 
 */
M.run = function(defs, fun) {
  var args = Array.from(arguments);
  args.shift();
  return liftContext(defs,function() {
    return context.run.apply(context,args);
  })();
};

/** 
 * Takes iterable returning effectful values, binds them passing values
 * from the previous steps into `next` argument
 *
 * @function M.seq
 * @param {Iterable} seq iterable returning effectful values 
 */
M.seq = function(i) {
  return context.seq(i);
};

M.runSeq = function(def, fun) {
  arguments[0] = function() {
    return def.seq(fun());
  }
  return M.run.apply(null, arguments);
}

/**
 * Simple replacement for ES2015 arguments spread. Takes function receiving 
 * set of arguments to a function receiving array. It is used in generated 
 * code.
 * @function M.spread
 * @param {Function} f function taking a few arguments
 * @return {Function} function taking single input argument
 */
M.spread = function(f) {
  return function(args) {
    return f.apply(null, args);
  };
};

/**
 * Constructs monadic value with inner value `v`.
 * @function M.pure
 * @param {Any} value
 * @return {MonadVal}
 */
M.pure = function(v) {
  return context.pure(v);
};

/**
 * Constructs monadic value representing exception.
 * @function M.raise
 * @param {Any} value
 * @return {MonadVal}
 */
M.raise = function(value) {
  return context.raise(value);
};

/**
 * Coercing values and exceptions. It wraps function `f` call with try-catch
 * statement and in case of exception turns it into `M.raise` or applies
 * value coercion procedure in case of no exceptions.
 * @function M.coerce
 * @param {Function} f
 * @return {MonadVal}
 */
M.coerce = coerce;
function coerce(f) {
  var ret;
  try {
    ret = f();
  } catch (e) {
    return context.raise(e);
  }
  return M(ret);
}

/**
 * Applies function `f` to monad inner value and returns monad with the same 
 * structure but with inner value substituted by result of `f(v)`.
 *
 * Default implementation uses `bind` and `pure`.
 * @function M.map
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
M.map = function(v,f) { return context.map(v,f); };

/**
 * Applies inner value of monadic value `v` to function `f`.
 *
 * Default implementation uses `join` and `map`.
 * @function M.bind
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
M.bind = function(v,f) { return context.map(v,f); };

/*
 * Executes function `f` and runs monadic value returned after
 * running `a` regardless it is succeed or raised exception.
 * Default implementation uses `bind`, `raise`, `handle`.
 * @function M.finally
 * @param {MonadVal} a
 * @param {Function} f
 * @return {MonadVal}
 */
M["finally"] = function(a, f) {
  return context["finally"](a,f);
};

/**
 * Takes monadic value of monadic value of some type and returns monadic
 * that type.
 *
 * Should be equivalent to:
 * 
 *      v => bind(v, (i) => i)
 *
 * Default implementation uses `bind`.
 * @function M.join
 * @param {MonadVal} v
 * @return {MonadVal}
 */
M.join = function(v) {
  return context.join(v);
};

/**
 * Helper function to simplify `arr` implementation. It only takes two monadic 
 * arguments and must return monadic value of two elements array with inner
 * values of arguments.
 *
 * Default implementation uses `bind` and `map` or `arr`.
 * @function M.pair
 * @param {MonadVal|Any} a
 * @param {MonadVal|Any} b
 * @return {MonadVal}
 */
M.pair = function(a, b) {
  return context.pair(a,b);
};

/**
 * Converts array of monadic values to monadic value of array of their inner 
 * values.
 *
 * Default implementation uses `pure`, `map` and `pair`.
 * @function M.arr
 * @param {Array} v
 * @return {MonadVal}
 */
M.arr = function(args) { return context.arr(args); };

/**
 * Executes function `body` passing it another function as arguments. 
 * Calling the passed function will exit the block with value provided as 
 * its argument.
 *
 * No default implementation.
 * @function M.block
 * @param {Function} body
 * @return {MonadVal}
 */
M.block = function(body) { return context.block(body); };

/**
 * Same as `M.block` but used in top level of functions for `return` and `yield`.
 * Default implementation simply redirects to `block`.
 * @function M.scope
 * @param {Function} body
 * @return {MonadVal}
 */
M.scope = function(body) { return context.scope(body); };

/**
 * This is a compiler directive making it not to treat result value
 * as effectful and not translate it into pure one. But some monads
 * implementations may also do something else here.
 * @function M.reify
 * @param {Function} arg
 * @return {Any}
 */
M.reify = function(arg) { return context.reify(arg); };

/**
 * This is a compiler directive for embedding monadic values. From 
 * original code perspective it converts monadic value into pure.
 * @function M.reflect
 * @param {MonadVal} arg
 * @return {Any}
 */
M.reflect = function(arg) { return context.reflect(arg); };

/**
 * Simply executes function `body` infinitely, the function receives `arg`
 * as argument of the first iteration and on next iteration it uses result
 * of the previous for this.
 *
 * Default implementation uses `bind`, `coerce`.
 * @function M.repeat
 * @param {Function} body function to iterate
 * @param {Any} arg first iteration argument
 * @return {MonadVal}
 */
M.repeat = function(body, arg) { return context.repeat(body, arg); };

/**
 * Simplified encoding of `for` statement.
 *
 * It is assumed each iteration doesn't depend on another so they may be run
 * in parallel. The `arg` parameter is passed to all functions on the first 
 * iteration, and on next iterations result of `upd` is used instead.
 *
 * Default implementation uses `bind`, `pure`.
 * @function M.forPar
 * @param {PureFunction} test returns true if another iteration must be executed
 * @param {Function} body the loop's body
 * @param {PureFunction} upd updates iterator variables
 * @param {Any} arg initial value of iterator
 * @return {MonadVal}
 */
M.forPar = function(test, body, upd, arg) {
  return context.forPar(test, body, upd, arg);
};

/**
 * Returns monad without answers for monads implementing Alternative interface.
 *
 * Default implementation uses `alt`.
 * @function M.empty
 * @return {MonadVal}
 */
M.empty = function() { return context.empty(); };

/**
 * Takes arbitrary number of monadic values, concatenates them into single 
 * monadic value returning all these answers. 
 *
 * Default implementation uses `plus` and `empty`.
 * @function M.alt
 * @param {Array} args
 * @return {MonadVal}
 */
M.alt = function() { return context.alt.map(context,arguments); };

/**
 * Helper function to simplify `alt` definition. Concatenates all 
 * answers from l and r into single monadic value with all the answers.
 * Default implementation uses `alt`.
 * @param {MonadVal} l
 * @param {MonadVal} r
 * @return {MonadVal}
 */
M.plus = function(l, r) { return context.alt(l, r); };

/*
 * Optional value. For monads implementing Alternative interface
 * it returns monadic value with number of answers in v + one 
 * undefined answer.
 * Default implementation uses `plus` and `pure`.
 * @function MonadDict.opt
 * @param {Array} args
 * @return {MonadVal}
 */
M.opt = function(v) { return context.opt(v); }

/**
 * Adds methods to a monadic value prototype. They redirect calls
 * into `this.mcontext` field. Where monad definition is to be stored.
 *
 * @function M.addMethods
 * @param {Object} proto prototype to agument
 * @param {Bool} overwrite if true it will add monadic methods even if 
 *                         they are already defined
 */
M.addMethods = function(proto, overwrite) {
  if (overwrite || !proto.mpair) {
    proto.mpair = function(other) {
      return this.mcontext.pair(this, other);
    };
  }
  if (overwrite || !proto.mbind) {
    proto.mbind = function(f) {
      return this.mcontext.bind(this, f);
    };
  }
  if (overwrite || !proto.mapply) {
    proto.mapply = function(f) {
      return this.mcontext.map(this, f);
    };
  }
  if (overwrite || !proto.mjoin) {
    proto.mjoin = function() {
      return this.mcontext.join(this);
    };
  }
  if (overwrite || !proto.mhandle) {
    proto.mhandle = function(f) {
      return this.mcontext.handle(this, f);
    };
  }
  if (overwrite || !proto.mfinally) {
    proto.mfinally = function(f) {
      return this.mcontext["finally"](this, f);
    };
  }
  if (overwrite || !proto.mconst) {
    proto.mconst = function(v) {
      return this.mcontext["const"](this, v);
    };
  }
  if (overwrite || !proto.munshiftTo) {
    proto.munshiftTo = function(v) {
      return this.mcontext.unshiftTo(this, v);
    };
  }
  if (overwrite || !proto.mplus) {
    proto.mplus = function(v) {
      return this.mcontext.plus(this, v);
    };
  }
  if (overwrite || !proto.malt) {
    proto.malt = function(v) {
      return this.mcontext.alt.map(this.mcontext,[this].concat(v));
    };
  }
  if (overwrite || !proto.mopt) {
    proto.mopt = function() {
      return this.mcontext.opt(this);
    };
  }
  if (overwrite || !proto.munpack) {
    proto.munpack = function() {
      return this.mcontext.unpack(this);
    };
  }
  return proto;
};

/**
 * Adds methods to a monadic value prototype. They redirect calls
 * into `this.mcontext` field and initializes the field with `defs`.
 * 
 * @function completePrototype
 * @param {MonadDict} monad definition to use
 * @param {Object} proto prototype to agument
 * @param {Bool} overwrite if true it will add monadic methods even if 
 *                         they are already defined
 * @return {MonadDict}
 */
M.completePrototype = function(defs, proto, overwrite) {
  if (overwrite || !proto.mcontext) {
    proto.mcontext = defs;
  }
  return M.addMethods(proto, overwrite);
};

/**
 * Adds default implementation of control operators and exception if 
 * they are not defined already. 
 * 
 * The implementation uses token threading approach. There on each binding
 * or exception handling input value is checked to match special token type.
 * If it doesn't match default action is performed but if it does it is either
 * passed further in case of `bind` or may execute an action for example
 * for `finally`.
 * 
 * @function M.addControlByToken
 * @param {MonadDict} inner monad definition to add new functionality to
 * @return {MonadDict} monad definition with the new functionality
 */
M.addControlByToken = function(inner) {
  var errTag = {}, res = {}, imap = inner.map,
      iraise = inner.raise, ihandle = inner.handle,
      ibind = inner.bind, ipure = inner.pure, icoerce = inner.coerce;
  function Unwind(val, tag1) {
    this.val = val;
    this.tag = tag1;
    this.unwindToken = true;
  }
  cloneBasic(inner,res);
  if (ihandle) {
    res.bind = ibind,
    res.map = imap,
    res.raise = iraise;
    res.repeat = inner.repeat;
    res.forPar = inner.forPar;
    res.handle = function(a, f) {
      return ihandle(a, function(v) {
        if (v != null && v.unwindToken)
          return iraise(v);
        return f(v);
      });
    };
    res["finally"] = inner["finally"];
    res.scope = res.block = function(body) {
      var brk, bv, m, tag;
      tag = {};
      brk = function(arg) {
        return iraise(new Unwind(arg, tag));
      };
      bv = body(brk);
      return ihandle(bv, function(v) {
        return (v != null && v.unwindToken && v.tag === tag) ? ipure(v.val) : iraise(v);
      });
    };
  } else {
    res.map = function(a, f) {
      return imap(a, function(v) {
        if (v != null && v.unwindToken)
          return v;
        return f(v);
      });
    };
    res.bind = function(a, f) {
      return ibind(a, function(v) {
        if (v != null && v.unwindToken)
          return ipure(v);
        return f(v);
      });
    };
    res.raise = function(e) {
      return ipure(new Unwind(e, errTag));
    };
    res.handle = function(a, f) {
      return ibind(a, function(v) {
        if (v != null && v.unwindToken) {
          if (v.tag === errTag)
            return f(v.val);
        }
        return ipure(v);
      });
    };
    res["finally"] = function(a, f) {
      return ibind(a, function(v1) {
        return imap(f(), function(v2) {
          return v2 && v2.unwindToken ? v2 : v1;
        });
      });
    };
    res.scope = res.block = function(body) {
      var brk, bv, m, tag;
      tag = {};
      brk = function(arg) {
        return ipure(new Unwind(arg, tag));
      };
      bv = body(brk);
      return ibind(bv, function(v) {
        return (v != null && v.unwindToken && v.tag === tag) ? ipure(v.val) : ipure(v);
      });
    };
  }
  return completeMonad(res).cloneDefs();
};

/**
 * Modifies each higher order function to store current monad definition
 * in global context variable.
 *
 * @see M.withContext
 * @see M.liftContext
 * @function M.addContext
 * @param {MonadDict} inner monad definition to add new functionality to
 * @return {MonadDict} monad definition with the new functionality
 */
M.addContext = function(inner, runOnly) {
  var res = {}, ibind = inner.bind, ihandle = inner.handle,
      ifin = inner["finally"], irepeat = inner.repeat, ipure = inner.pure,
      iforPar = inner.forPar, irun = inner.run, iscope = inner.scope, 
      iseq = inner.seq, iblock = inner.block, imap = inner.map;
  res.bind = runOnly ? ibind : function(a, f) {
    return ibind(a, liftContext1(res,f));
  };
  cloneBasic(inner,res);
  res.map = imap;
  res.handle = runOnly ? ihandle : function(a, f) {
    return ihandle(a, liftContext1(res,f));
  };
  res["finally"] = runOnly ? ifin : function(a, f) {
    return ifin(a, liftContext1(res,f));
  };
  res.repeat = runOnly ? irepeat : function(f, arg) {
    return irepeat(liftContext1(res,f), arg);
  };
  res.forPar = runOnly ? iforPar : function(test, body, upd, arg) {
    return iforPar(test, liftContext1(res,body), upd, arg);
  };
  res.block = runOnly ? iblock : function(f) {
    return iblock(liftContext1(res,f));
  };
  res.scope = runOnly ? iscope : function(f) {
    return iscope(liftContext1(res,f));
  };
  res.run = function(f) {
    var args = Array.from(arguments);
    args[0] = liftContext(res,f);
    return irun.apply(this, args);
  };
  res.seq = function(f) {
    return iseq(liftContextG(res, f));
  }
  return completeMonad(res).cloneDefs();
};

/**
 * Adds coercing to all function's result expecting monadic value
 *
 * @function M.addCoerce
 * @param {MonadDict} inner monad definition to add new functionality to
 * @return {MonadDict} monad definition with the new functionality
 */
M.addCoerce = function(inner, runOnly) {
  var res = {}, ibind = inner.bind, ihandle = inner.handle, ipure = inner.pure,
      ifin = inner["finally"], irepeat = inner.repeat, iscope = inner.scope,
      iforPar = inner.forPar, irun = inner.run, icoerce = inner.coerce,
      iblock = inner.block, imap = inner.map;
  if (!icoerce)
    throw new Error("no coerce function");
  function lift(f) {
    return function() {
      return icoerce(f.apply(null, arguments));
    }
  }
  function lift1(f) {
    return function(a) {
      return icoerce(f(a));
    }
  }
  function liftIterator(i) {
    return {
      next: function() {
        var v = i.next();
        if (v.done) 
          return v;
        return {
          value: icoerce(v.value)
        };
      }
    };
  }
  cloneBasic(inner,res);
  res.liftCoerce = lift;
  res.liftCoerce1 = lift1;
  res.bind = function(a, f) { return ibind(a, lift1(f)); };
  res.map = imap;
  res.handle = function(a, f) { return ihandle(a, lift1(f)); };
  res["finally"] = function(a, f) { return ifin(a, lift1(f)); };
  res.repeat = function(f, arg) { return irepeat(lift1(f), arg); };
  res.forPar = function(test, body, upd, arg) {
    return iforPar(test, lift1(body), upd, arg);
  };
  res.block = function(f) { return iblock(lift1(f)); };
  res.scope = function(f) { return iscope(lift1(f)); };
  res.run = function(f) {
    var args = Array.from(arguments);
    args[0] = lift(f);
    return irun.apply(this, args);
  };
  res.seq = function(f) {
    return iseq(liftIterator(f()));
  }
  return completeMonad(res);
};

M.wrap = wrap;
/**
 * Takes monad definition and generates another definition where each definition
 * is wrapped with another constructor `Wrap`. The `Wrap` constructor should 
 * construct an object with `inner` field pointing to original monadic value.
 *
 * This is needed to avoid monadic value prototype pollution if there are a few 
 * monads implementations for the same type or the type is too generic, like
 * Function.
 *
 * @function M.wrap
 * @param {MonadDict} inner original monad definition
 * @param {Function} Wrap wrap constructor for wrapper 
 * @return {MonadDict}
 */
function wrap(inner, Wrap) {
  function M(i) {
    this.inner = i;
  }
  if (Wrap === true)
    Wrap = M;
  var coerce, unpack, res = {}, ipure = inner.pure, ibind = inner.bind,
      imap = inner.map, ihandle = inner.handle, iraise = inner.raise,
      ifin = inner["finally"], ipair = inner.pair, iarr = inner.arr,
      iplus = inner.plus, ireflect = inner.reflect, ireify = inner.reify,
      irun = inner.run, ialt = inner.alt, iempty = inner.empty,
      irepeat = inner.repeat, iforPar = inner.forPar, iblock = inner.block,
      iscope = inner.scope, icoerce = inner.coerce;
  if (icoerce) {
    res.unpack = unpack = function(v) { return coerce(v).inner; };
    res.coerce = coerce = function(v) {
      if (v != null && v.constructor === Wrap)
        return v;
      return new Wrap(icoerce(v));
    };
  } else {
    res.unpack = unpack = function(v) { return v.inner; }
  }
  res.pack = function(v) { return new Wrap(v); }
  res.pure = function(v) {
    return new Wrap(ipure(v));
  };
  res.map = function(a, f) {
    return new Wrap(imap(unpack(a), f));
  };
  res.bind = function(a, f) {
    return new Wrap(ibind(unpack(a), function(v) {
      return unpack(f(v));
    }));
  };
  res.raise = function(e) {
    return new Wrap(iraise(e));
  };
  res.handle = function(a, f) {
    return new Wrap(ihandle(unpack(a), function(v) {
      return unpack(f(v));
    }));
  };
  res["finally"] = function(a, f) {
    return new Wrap(ifin(unpack(a), function() {
      return unpack(f());
    }));
  };
  res.pair = function(l, r) {
    return new Wrap(ipair(unpack(l), unpack(r)));
  };
  res.arr = function(v) {
    var i, j, len, r = [];
    for (j = 0, len = v.length; j < len; j++) {
      i = v[j];
      r.push(unpack(v));
    }
    return new Wrap(iarr(r));
  };
  res.reify = function(v) {
    return unpack(ireify(v));
  };
  res.reflect = function(v) {
    return new Wrap(ireflect(v))
  };
  res.run = function(f) {
    var args = Array.from(arguments);
    args[0] = function() {
      return unpack(f());
    };
    return irun.apply(inner, args);
  };
  res.repeat = function(f, arg) {
    return new Wrap(irepeat(function(arg) {
      return unpack(f(arg));
    }, arg));
  };
  res.forPar = function(test, body, upd, arg) {
    return new Wrap(iforPar(test, function(arg) {
      return unpack(body(arg));
    }, upd, arg));
  };
  res.block = function(f) {
    return new Wrap(iblock(function(l) {
      return unpack(f(function(arg) {
        return new Wrap(l(arg));
      }));
    }));
  };
  res.scope = function(f) {
    return new Wrap(iscope(function(l) {
      return unpack(f(function(arg) {
        return new Wrap(l(arg));
      }));
    }));
  };
  return completeMonad(res).cloneDefs();
}

M.defaults = defaults;
/**
 * Runs definitions transformations based on specified set of options.
 * 
 * Options:
 * * wrap - constructor function used for wrapped value, 
 *          it should construct objects with inner field
 * * context - boolean or "run" string for only wrapping run method,
 *             default is true
 * * coerce - boolean for adding coercions to functions returning 
 *            monadic values, default is true
 * * control - string "token" for adding control operators implementation
 *             using special token passing
 * @function M.defaults
 * @param {MonadDict} inner original monad definition
 * @param {Object} options
 * @return {MonadDict}
 */
function defaults(defs,opts) {
  if (!opts)
    opts = {}
  if (opts.context == null)
    opts.context = true;
  if (opts.coerce == null)
    opts.coerce = true;
  completeMonad(defs);
  if (opts.control === "token")
    defs = M.addControlByToken(defs);
  if (opts.wrap)
    defs = M.wrap(defs,opts.wrap);
  if (opts.coerce)
    defs = M.addCoerce(defs);
  if (opts.context)
    defs = M.addContext(defs, opts.context === "run");
  if (opts.wrap)
    M.completePrototype(defs,opts.wrap.prototype);
  return defs;
}

/**
 * Sets global context.
 * 
 * Do not use it unless whole project uses single monad. 
 * 
 * @function M.setContext
 * @param {MonadDict} monad definition to store
 * @return {MonadDict} former context
 */
M.setContext = function(ctx) {
  var old = context;
  context = ctx;
  return old;
};

/**
  * Returns current context
  * @function M.getContext
  * @return {MonadDict}
  */
M.getContext = function() {
  return context;
}

M.withContext = withContext;
/**
 * Runs function fun within global context is initialized to `ctx` and after
 * finishing reverts it back.
 *
 * @function M.withContext
 * @param {MonadDict} ctx
 * @param {Function} func
 * @return {Any} result of `func` application
 */
function withContext(ctx, func) {
  return liftContext(ctx, func)();
}

M.liftContext = liftContext;
M.liftContext1 = liftContext1;
M.liftContext2 = liftContext2;
M.liftContextG = liftContextG;
/**
 * Turns a function into a function initializing global context to `ctx`
 * and reverting it to the old value on exit.
 *
 * @function M.liftContext
 * @param {MonadDict} ctx
 * @param {Function} func
 * @return {Function}
 */
function liftContext(ctx, func) {
  if (!ctx.pure) {
    throw new Error("no monad's definition is provided");
  }
  return function() {
    var saved;
    saved = context;
    context = ctx;
    try {
      return func.apply(null, arguments);
    } finally {
      context = saved;
    }
  };
}

/**
 * Same as `liftContext` but lifts generator function.
 *
 * @function M.liftContextG
 * @param {MonadDict} ctx
 * @param {GeneratorFunction} gen
 * @return {Function}
 */
function liftContextG(ctx, gen) {
  return liftContext(ctx, function() {
    return liftContextIterator(ctx, gen.apply(null, arguments));
  });
}

function liftContextIterator(ctx, i) {
  return { next: liftContext(ctx, i.next.bind(i)) };
}

function liftContext1(ctx, func) {
  if (!ctx.pure) {
    throw new Error("no monad's definition is provided");
  }
  return function inContext(a) {
    var saved;
    saved = context;
    context = ctx;
    try {
      return func(a);
    } finally {
      context = saved;
    }
  };
}

function liftContext2(ctx, func) {
  if (!ctx.pure) {
    throw new Error("no monad's definition is provided");
  }
  return function inContext(a,b) {
    var saved;
    saved = context;
    context = ctx;
    try {
      return func(a,b);
    } finally {
      context = saved;
    }
  };
}

M.Monad = Monad;
/**
  * Monadic value taking function's definitions from global context
  *
  * @param 
  * @class M.Monad
  */
function Monad(inner) {
  this.inner = inner;
}

/**
  * Wraps monadic values in `M.Monad` objects
  * @funtion M.wrapGlobal
  * @param {MonadDict} def
  * @return {MonadDict}
  */
M.wrapGlobal = function(def) {
  return wrap(def,Monad);
};

Monad.prototype.coerce = function(val) {
  if (val && val.constructor === Monad)
    return val;
  return new Monad(context.coerce(val));
};

function unpackM(val) {
  if (val && val.constructor === Monad) {
    return val.inner;
  } else {
    return context.coerce(val);
  }
}

Monad.prototype.mpair = function(other) {
  return context.pair(this.inner, other);
};

Monad.prototype.mbind = function(f) {
  return context.bind(this.inner, f);
};

Monad.prototype.mbind = function(f) {
  return context.bind(this, f);
};

Monad.prototype.mapply = function(f) {
  return context.map(this, f);
};

Monad.prototype.mjoin = function() {
  return context.join(this);
};

Monad.prototype.mhandle = function(f) {
  return context.handle(this, f);
};

Monad.prototype.mfinally = function(f) {
  return context["finally"](this, f);
};

Monad.prototype.mconst = function(v) {
  return context["const"](this, v);
};

Monad.prototype.munshiftTo = function(v) {
  return context.unshiftTo(this, v);
};

Monad.prototype.mplus = function(v) {
  return context.plus(this, v);
};

Monad.prototype.malt = function(v) {
  return context.alt.apply(context,[this].concat(v));
};

Monad.prototype.mopt = function() {
  return context.opt(this);
};

Monad.prototype.munpack = function() {
  return context.unpack(this);
};

