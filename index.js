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
  };
  return iter(0);
}

/**
 * Class with default implementations for interface expected by mfjs compiler
 * output.
 * 
 * Extend it to get default implementations for most of required methods.
 * @class M.MonadDict
 */
function MonadDict() {}

M.MonadDict = MonadDict;

/**
 * Constructs monadic value with inner value `v`.
 *
 * No default implementation.
 * @function MonadDict.pure
 * @param {Any} v
 * @return {MonadVal}
 */
MonadDict.prototype.pure = function(v) {
  throw new Error('pure is not implemented');
};

/**
 * Constructs monadic value representing exception.
 *
 * No default implementation.
 * @function MonadDict.raise
 * @param {Any} v
 * @return {MonadVal}
 */
MonadDict.prototype.raise = function(v) {
  throw new Error('raise is not implemented');
};

/**
 * Coercing value, by default always returns argument value, so the 
 * function is required to implement if Monad needs coercion.
 *
 * By default simply returns its argument assuming no coercion support.
 * @function MonadDict.coerce
 * @param {MonadVal|Any} v
 * @return {MonadVal}
*/
MonadDict.prototype.coerce = function(v) {
  return v;
};

/**
 * Applies function `f` to monad inner value and returns monad with the same 
 * structure but with inner value substituted by result of `f(v)`.
 *
 * Default implementation uses `bind` and `pure`.
 * @function MonadDict.apply
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
MonadDict.prototype.apply = function(a, f) {
  var m = this;
  return this.bind(a, function(v) {
    return m.pure(f(v));
  });
};

/**
 * Applies inner value of monadic value `v` to function `f`.
 *
 * Default implementation uses `join` and `apply`.
 * @function MonadDict.bind
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
MonadDict.prototype.bind = function(a, f) {
  var m = this;
  return this.join(this.apply(a, function(v) {
    return m.coerce(f(v));
  }));
};

/**
 * Helper function to simplify `arr` implementation. It only takes two monadic 
 * arguments and must return monadic value of two elements array with inner
 * values of arguments.
 * Default implementation uses `bind` and `apply`.
 * @function MonadDict.pair
 * @param {MonadVal|Any} a
 * @param {MonadVal|Any} b
 * @return {MonadVal}
 */
MonadDict.prototype.pair = function(a, b) {
  var m = this;
  return this.bind(a, function(av) {
    return m.apply(b, function(bv) {
      return [av, bv];
    });
  });
};

/**
 * Converts array of monadic values to monadic value of array of their inner 
 * values.
 *
 * Default implementation uses `pure`, `apply` and `pair`.
 * @function MonadDict.arr
 * @param {Array} v
 * @return {MonadVal}
 */
MonadDict.prototype.arr = function(v) {
  switch (v.length) {
  case 0:
    return this.pure([]);
  case 1:
    return this.apply(v[0], function(v) {
      return [v];
    });
  case 2:
    return this.pair(v[0], v[1]);
  default:
    return this.apply(this.pair(v[0], v(v.slice(1))), function(arg1) {
      return [arg1[0]].concat(arg1[1]);
    });
  }
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
 * @function MonadDict.join
 * @param {MonadVal} v
 * @return {MonadVal}
 */
MonadDict.prototype.join = function(v) {
  return this.bind(v, function(v) {
    return v;
  });
};

/*
 * Simply executes function `body` infinitely, the function receives `arg`
 * as argument of the first iteration and on next iteration it uses result
 * of the previous for this.
 *
 * Default implementation uses `bind`, `coerce`.
 *
 * @function MonadDict.repeat
 * @param {Function} body
 * @param {Any} arg
 * @return {MonadVal}
 */
MonadDict.prototype.repeat = function(body, arg) {
  var m = this,
      iter = function(arg) {
        return m.bind(m.coerce(body(arg)), iter);
      };
  return iter(arg);
};

/*
 * Simplified encoding of `for` statement.
 *
 * It is assumed each iteration doesn't depend on another so they may be run
 * in parallel. The `arg` parameter is passed to all functions on the first 
 * iteration, and on next iterations result of `upd` is used instead.
 *
 * Default implementation uses `bind`, `pure`.
 *
 * @function MonadDict.forPar
 * @param {PureFunction} test
 * @param {Function} body
 * @param {PureFunction} upd
 * @param {Any} arg
 * @return {MonadVal}
 */
MonadDict.prototype.forPar = function(test, body, upd, arg) {
  var m = this,
      iter = function(arg) {
        if (test(arg)) {
          return m.bind(body(arg), function() {
            return iter(upd(arg));
          });
        } else {
          return m.pure(arg);
        }
      };
  return iter(arg, null);
};

/*
 * This is a compiler directive making it not to treat result value
 * as effectful and not translate it into pure one. But some monads
 * implementations may also do something else here.
 * @function MonadDict.reify
 * @param {Function} f
 * @return {Any} depends on monad implementation
 */
MonadDict.prototype.reify = function(v) {
  return v();
};

/*
 * Function to call at top level to get final result.
 * 
 * @function MonadDict.run
 * @param {Function} f
 * @return {Any} depends on monad implementation
 */
MonadDict.prototype.run = function(f) {
  return this.reify(f);
};

/*
 * Executes function `f` and runs monadic value returned after
 * running `a` regardless it is succeed or raised exception.
 * Default implementation uses `bind`, `raise`, `handle`.
 * @function MonadDict.finally
 * @param {MonadVal} a
 * @param {Function} f
 * @return {MonadVal}
 */
MonadDict.prototype["finally"] = function(a, f) {
  var m  = this;
  return this.bind(this.handle(a, function(e) {
    return m.bind(f(), function() {
      return m.raise(e);
    });
  }), function(v) {
    return m["const"](f(), v);
  });
};

/*
 * Executes function `body` passing it another function as arguments. 
 * Calling the passed function will exit the block with value provided as 
 * its argument.
 *
 * No default implementation.
 *
 * WARNING: these are not continuations. The function is here only to support JS
 * control operations (like `break`, `continue`) and typical monad will accept
 * it only if the exit function called once and only from within `body`. This is
 * just a special kind of exception.
 * @function MonadDict.block
 * @param {Function} body
 * @return {MonadVal}
 */
MonadDict.prototype.block = function(body) {
  throw new Error('block is not implemented');
};

/*
 * Same as `M.block` but used in top level of functions for `return` and `yield`.
 * @function MonadDict.scope
 * Default implementation simply redirects to `block`.
 * @param {Function} f
 * @return {MonadVal}
 */
MonadDict.prototype.scope = function(body) {
  return this.block(body);
};

/*
 * Takes arbitrary number of monadic values, concatenates them into single 
 * monadic value returning all these answers. 
 *
 * Default implementation uses `plus` and `empty`.
 *
 * @function MonadDict.alt
 * @param {MonadVal*} args
 * @return {MonadVal}
 */
MonadDict.prototype.alt = function() {
  var i, j, len, cur = this.empty();
  for (j = 0, len = arguments.length; j < len; j++) {
    i = arguments[j];
    cur = this.plus(cur, i);
  }
  return cur;
};

/*
 * Returns monad without answers for monads implementing Alternative interface.
 *
 * Default implementation uses `alt`.
 *
 * @function MonadDict.empty
 * @param {Array} args
 * @return {MonadVal}
 */
MonadDict.prototype.empty = function() { return this.alt(); };

/*
 * Optional value. For monads implementing Alternative interface
 * it returns monadic value with number of answers in v + one 
 * undefined answer.
 * Default implementation uses `plus` and `pure`.
 * @function MonadDict.opt
 * @param {Array} args
 * @return {MonadVal}
 */
MonadDict.prototype.opt = function(v) {
  return this.plus(v, this.pure());
};

/**
 * Helper function to simplify `alt` definition. Concatenates all 
 * answers from l and r into single monadic value with all the answers.
 * Default implementation uses `alt`.
 * @param {MonadVal} l
 * @param {MonadVal} r
 * @return {MonadVal}
 */
MonadDict.prototype.plus = function(l, r) {
  return this.alt(l, r);
};

/**
 * Short equivalent to: `(a,arg) => M.apply(a, () => arg)`, but some 
 * implementations may override it to implement something more effective.
 * 
 * Default implementation uses `apply`.
 * @function MonadDict.const
 * @param {MonadVal} a value to apply to
 * @param {Any} arg value to use in result instead
 * @return {MonadVal}
 */
MonadDict.prototype["const"] = function(a, arg) {
  return this.apply(a, function() {
    return arg;
  });
};

/**
 * Short equivalent to: `(a,arg) => M.apply(a, (v) => arg.unshift(v), arg)`
 * 
 * Default implementation uses `apply`
 * @function MonadDict.unshiftTo
 * @param {MonadVal} a
 * @param {Array} arg
 * @return {MonadVal}
 */
MonadDict.prototype.unshiftTo = function(a, arg) {
  return this.apply(a, function(v) {
    arg.push(v);
    return arg;
  });
};

/**
* For wrapped monadic values with will return value stored in it.
* 
* @function MonadDict.unpack
* @param {MonadVal} v
* @return {MonadVal}
*/
MonadDict.prototype.unpack = function(v) { return v; };

/** 
 * Calls `run` from current context.
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
 * Calls current context `pure` method.
 * @function M.pure
 * @param {Any} value
 * @return {MonadVal}
 */
M.pure = function(v) {
  return context.pure(v);
};

/**
 * Calls current context `raise` method.
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
 * Calls current context `apply` method
 * @function M.apply
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
M.apply = function(v,f) { return context.apply(v,f); };

/**
 * Calls current context `apply` method
 * @function M.bind
 * @param {MonadVal|Any} v
 * @param {Function} f
 * @return {MonadVal}
 */
M.bind = function(v,f) { return context.apply(v,f); };

/**
 * Calls current context `arr` method.
 * @function M.arr
 * @param {Array} v
 * @return {MonadVal}
 */
M.arr = function(args) { return context.arr(args); };

/**
 * Calls current context `block` method.
 * @function M.block
 * @param {Function} body
 * @return {MonadVal}
 */
M.block = function(body) { return context.block(body); };

/**
 * Calls current context `scope` method.
 * @function M.scope
 * @param {Function} body
 * @return {MonadVal}
 */
M.scope = function(body) { return context.scope(body); };

/**
 * Calls current context `reify` method.
 * @function M.reify
 * @param {Function} arg
 */
M.reify = function(arg) { return context.reify(arg); };

/**
 * Calls current context `repeat` method.
 * @function M.repeat
 * @param {Function} body function to iterate
 * @param {Any} arg first iteration argument
 * @return {MonadVal}
 */
M.repeat = function(body, arg) { return context.repeat(body, arg); };

/**
 * Calls current context `forPar` method.
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
 * Calls current context `empty` method.
 * @function M.empty
 * @return {MonadVal}
 */
M.empty = function() { return context.empty(); };

/**
 * Calls current context `alt` method.
 * @function M.alt
 * @param {Array} args
 * @return {MonadVal}
 */
M.alt = function() { return context.alt.apply(context,arguments); };


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
  if (overwrite || !proto.pair) {
    proto.mpair = function(other) {
      return this.mcontext.pair(this, other);
    };
  }
  if (overwrite || !proto.bind) {
    proto.mbind = function(f) {
      return this.mcontext.bind(this, f);
    };
  }
  if (overwrite || !proto.apply) {
    proto.mapply = function(f) {
      return this.mcontext.apply(this, f);
    };
  }
  if (overwrite || !proto.join) {
    proto.mjoin = function() {
      return this.mcontext.join(this);
    };
  }
  if (overwrite || !proto.handle) {
    proto.mhandle = function(f) {
      return this.mcontext.handle(this, f);
    };
  }
  if (overwrite || !proto["finally"]) {
    proto.mfinally = function(f) {
      return this.mcontext["finally"](this, f);
    };
  }
  if (overwrite || !proto["const"]) {
    proto.mconst = function(v) {
      return this.mcontext["const"](this, v);
    };
  }
  if (overwrite || !proto.munshiftTo) {
    proto.munshiftTo = function(v) {
      return this.mcontext.unshiftTo(this, v);
    };
  }
  if (overwrite || !proto.plus) {
    proto.mplus = function(v) {
      return this.mcontext.plus(this, v);
    };
  }
  if (overwrite || !proto.alt) {
    proto.malt = function(v) {
      return this.mcontext.alt.apply(this.mcontext,[this].concat(v));
    };
  }
  if (overwrite || !proto.opt) {
    proto.mopt = function() {
      return this.mcontext.opt(this);
    };
  }
  if (overwrite || !proto.unpack) {
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
 * @function M.withControlByToken
 * @param {MonadDict} inner monad definition to add new functionality to
 * @return {MonadDict} monad definition with the new functionality
 */
M.withControlByToken = function(inner) {
  var errTag = {};
  function Unwind(val, tag1) {
    this.val = val;
    this.tag = tag1;
  }
  function TokenControl() {}
  TokenControl.prototype = new MonadDict();
  TokenControl.prototype.orig = inner;
  TokenControl.prototype.pure = inner.pure;
  TokenControl.prototype.raise = inner.raise;
  TokenControl.prototype.coerce = inner.coerce;
  TokenControl.prototype.reify = inner.reify;
  TokenControl.prototype.alt = inner.alt;
  TokenControl.prototype.empty = inner.empty;
  TokenControl.prototype.Unwind = Unwind;
  TokenControl.prototype.run = inner.run;
  TokenControl.prototype.apply = function(a, f) {
    return inner.apply(a, function(v) {
      if (v != null && v.constructor === Unwind) {
        return v;
      }
      return f(v);
    });
  };
  TokenControl.prototype.bind = function(a, f) {
    var m;
    m = this;
    return inner.bind(a, function(v) {
      if (v != null && v.constructor === Unwind) {
        return m.pure(v);
      }
      return f(v);
    });
  };
  TokenControl.prototype.repeat = inner.repeat;
  TokenControl.prototype.forPar = inner.forPar;
  TokenControl.prototype.block = function(body) {
    var brk, bv, m, tag;
    tag = {};
    m = this;
    brk = function(arg) {
      return m.pure(new Unwind(arg, tag));
    };
    bv = body(brk);
    return inner.apply(m.coerce(bv), function(v) {
      if (v != null && v.constructor === Unwind && v.tag === tag) {
        return v.val;
      } else {
        return v;
      }
    });
  };
  if (inner.handle) {
    TokenControl.prototype.raise = function(e) {
      return inner.raise(e);
    };
    TokenControl.prototype.handle = function(a, f) {
      return inner.handle(a, f);
    };
    TokenControl.prototype["finally"] = function(a, f) {
      return inner["finally"](a, f);
    };
  } else {
    TokenControl.prototype.raise = function(e) {
      return new Unwind(e, errTag);
    };
    TokenControl.prototype.handle = function(a, f) {
      var m;
      m = this;
      return inner.bind(a, function(v) {
        if (v != null && v.constructor === Unwind) {
          if (v.tag === errTag) {
            return f(v.val);
          }
        }
        return m.pure(v);
      });
    };
    TokenControl.prototype["finally"] = function(a, f) {
      return inner.bind(a, function(v) {
        return inner.apply(f(), function() {
          return v;
        });
      });
    };
  }
  return new TokenControl();
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
M.addContext = function(inner) {
  function WithContext() {}
  WithContext.prototype = Object.create(inner);
  WithContext.prototype.liftContext = function(f) {
    return liftContext(this, f);
  };
  WithContext.prototype.bind = function(a, f) {
    return inner.bind.call(this, a, this.liftContext(f));
  };
  WithContext.prototype.handle = function(a, f) {
    return inner.handle.call(this, a, this.liftContext(f));
  };
  WithContext.prototype["finally"] = function(a, f) {
    return inner["finally"].call(this, a, this.liftContext(f));
  };
  WithContext.prototype.repeat = function(f, arg) {
    return inner.repeat.call(this, this.liftContext(f), arg);
  };
  WithContext.prototype.forPar = function(test, body, upd, arg) {
    return inner.forPar.call(this, test, this.liftContext(body), upd, arg);
  };
  WithContext.prototype.run = function(f) {
    var args = Array.from(arguments);
    args[0] = this.liftContext(f);
    return inner.run.apply(this, args);
  };
  WithContext.prototype.block = function(f) {
    return inner.block.call(this, this.liftContext(f));
  };
  return new WithContext();
};


M.defaults = defaults;
/**
 * Combination of control by token and context. 
 * @function M.defaults
 * @param {MonadDict} inner original monad definition
 * @return {MonadDict}
 */
function defaults(inner) {
  return M.addContext(M.withControlByToken(inner));
}


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
  function coerce(v) {
    if (v != null && v.constructor === Wrap) {
      return v;
    }
    return pack(inner.coerce(v));
  }
  function pack(v) {
    return new Wrap(v);
  }
  function unpack(v) {
    return coerce(v).inner;
  }
  function Wrapped() {}
  Wrapped.prototype = new MonadDict();
  Wrapped.prototype.orig = inner;
  Wrapped.prototype.pure = function(v) {
    return new Wrap(inner.pure(v));
  };
  Wrapped.prototype.coerce = coerce;
  Wrapped.prototype.apply = function(a, f) {
    return pack(inner.apply(unpack(a), f));
  };
  Wrapped.prototype.bind = function(a, f) {
    return pack(inner.bind(unpack(a), function(v) {
      return unpack(f(v));
    }));
  };
  Wrapped.prototype.raise = function(e) {
    return pack(inner.raise(e));
  };
  Wrapped.prototype.handle = function(a, f) {
    return pack(inner.handle(unpack(a), function(v) {
      return unpack(f(v));
    }));
  };
  Wrapped.prototype["finally"] = function(a, f) {
    return pack(inner["finally"](unpack(a), function() {
      return unpack(f());
    }));
  };
  Wrapped.prototype.pair = function(l, r) {
    return pack(inner.pair(unpack(l), unpack(r)));
  };
  Wrapped.prototype.arr = function(v) {
    var i, j, len, r = [];
    for (j = 0, len = v.length; j < len; j++) {
      i = v[j];
      r.push(unpack(v));
    }
    return pack(inner.arr(r));
  };

  Wrapped.prototype.reify = function(v) {
    return pack(inner.reify(v));
  };

  Wrapped.prototype.unpack = unpack;
  
  Wrapped.prototype.run = function(f) {
    var args = Array.from(arguments);
    args[0] = function() {
      return unpack(f());
    };
    return inner.run.apply(inner, args);
  };

  Wrapped.prototype.repeat = function(f, arg) {
    return pack(inner.repeat(function(arg) {
      return unpack(f(arg));
    }, arg));
  };

  Wrapped.prototype.forPar = function(test, body, upd, arg) {
    return pack(inner.forPar(test, function(arg) {
      return unpack(body(arg));
    }, upd, arg));
  };

  Wrapped.prototype.block = function(f) {
    return pack(inner.block(function(l) {
      return unpack(f(function(arg) {
        return pack(l(arg));
      }));
    }));
  };
  return new Wrapped();
}

/**
* Sets global context.
* 
* Do not use it unless whole project uses single monad. 
* 
* @function M.setContext
* @param {MonadDict} monad definition to store
*/
M.setContext = function(ctx) {
  return context = ctx;
};

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
  return context.apply(this, f);
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
