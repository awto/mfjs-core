

<!-- Start index.js -->

# Abstract runtime library for mfjs compiler

The doc assumes name `M` is used for namespace of the module.

    var M = require('@mfjs/core');

## M

Coerces argument value to current Monad.

Coercsion in general is monad specific, but by default this means checking if
the value already has current monad type it is simply returned, or otherwise 
`M.pure(v)` is returned.

### Params:

* **MonadVal|Any** *v* 

### Return:

* **MonadVal** 

## M.forInIterator(args)

Returns simple iterator for `for-in` statement implementation.

It is not ES compatible, because ES iterator is mutable. This doesn't fit
well in monadic framework. 
The returned iterator is a function, calling it either
returns null if there are no other values or another function for next 
value with current value in field `value`

### Params:

* **Object** *args* 

### Return:

* **Iterator** 

## MonadDict

Class with default implementations for interface expected by mfjs compiler
output.

Extend it to get default implementations for most of required methods.

## MonadDict.pure(v)

Constructs monadic value with inner value `v`.

No default implementation.

### Params:

* **Any** *v* 

### Return:

* **MonadVal** 

## MonadDict.raise(v)

Constructs monadic value representing exception.

No default implementation.

### Params:

* **Any** *v* 

### Return:

* **MonadVal** 

## MonadDict.coerce(v)

Coercing value, by default always returns argument value, so the 
function is required to implement if Monad needs coercion.

By default simply returns its argument assuming no coercion support.

### Params:

* **MonadVal|Any** *v* 

### Return:

* **MonadVal** 

## MonadDict.apply(v, f)

Applies function `f` to monad inner value and returns monad with the same 
structure but with inner value substituted by result of `f(v)`.

Default implementation uses `bind` and `pure`.

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## MonadDict.bind(v, f)

Applies inner value of monadic value `v` to function `f`.

Default implementation uses `join` and `apply`.

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## MonadDict.pair(a, b)

Helper function to simplify `arr` implementation. It only takes two monadic 
arguments and must return monadic value of two elements array with inner
values of arguments.
Default implementation uses `bind` and `apply`.

### Params:

* **MonadVal|Any** *a* 
* **MonadVal|Any** *b* 

### Return:

* **MonadVal** 

## MonadDict.arr(v)

Converts array of monadic values to monadic value of array of their inner 
values.

Default implementation uses `pure`, `apply` and `pair`.

### Params:

* **Array** *v* 

### Return:

* **MonadVal** 

## MonadDict.join(v)

Takes monadic value of monadic value of some type and returns monadic
that type.

Should be equivalent to:

     v => bind(v, (i) => i)

Default implementation uses `bind`.

### Params:

* **MonadVal** *v* 

### Return:

* **MonadVal** 

## MonadDict.repeat(body, arg)

Simply executes function `body` infinitely, the function receives `arg`
as argument of the first iteration and on next iteration it uses result
of the previous for this.

Default implementation uses `bind`, `coerce`.

### Params:

* **Function** *body* 
* **Any** *arg* 

### Return:

* **MonadVal** 

## MonadDict.forPar(test, body, upd, arg)

Simplified encoding of `for` statement.

It is assumed each iteration doesn't depend on another so they may be run
in parallel. The `arg` parameter is passed to all functions on the first 
iteration, and on next iterations result of `upd` is used instead.

Default implementation uses `bind`, `pure`.

### Params:

* **PureFunction** *test* 
* **Function** *body* 
* **PureFunction** *upd* 
* **Any** *arg* 

### Return:

* **MonadVal** 

## MonadDict.reify(f)

This is a compiler directive making it not to treat result value
as effectful and not translate it into pure one. But some monads
implementations may also do something else here.

### Params:

* **Function** *f* 

### Return:

* **Any** depends on monad implementation

## MonadDict.run(f)

Function to call at top level to get final result.

### Params:

* **Function** *f* 

### Return:

* **Any** depends on monad implementation

## MonadDict.finally(a, f)

Executes function `f` and runs monadic value returned after
running `a` regardless it is succeed or raised exception.
Default implementation uses `bind`, `raise`, `handle`.

### Params:

* **MonadVal** *a* 
* **Function** *f* 

### Return:

* **MonadVal** 

## MonadDict.block(body)

Executes function `body` passing it another function as arguments. 
Calling the passed function will exit the block with value provided as 
its argument.

No default implementation.

WARNING: these are not continuations. The function is here only to support JS
control operations (like `break`, `continue`) and typical monad will accept
it only if the exit function called once and only from within `body`.

### Params:

* **Function** *body* 

### Return:

* **MonadVal** 

## MonadDict.scope Default implementation simply redirects to `block`.(f)

Same as `M.block` but used in top level of functions for `return` and `yield`.

### Params:

* **Function** *f* 

### Return:

* **MonadVal** 

## MonadDict.alt(args)

Takes array of monadic values, concatenates them into single monadic
value returning all these answers. 

Default implementation uses `plus` and `empty`.

### Params:

* **Array** *args* 

### Return:

* **MonadVal** 

## MonadDict.empty(args)

Returns monad without answers for monads implementing Alternative interface.

Default implementation uses `alt`.

### Params:

* **Array** *args* 

### Return:

* **MonadVal** 

## MonadDict.opt(args)

Optional value. For monads implementing Alternative interface
it returns monadic value with number of answers in v + one 
undefined answer.
Default implementation uses `plus` and `pure`.

### Params:

* **Array** *args* 

### Return:

* **MonadVal** 

## plus(l, r)

Helper function to simplify `alt` definition. Concatenates all 
answers from l and r into single monadic value with all the answers.
Default implementation uses `alt`.

### Params:

* **MonadVal** *l* 
* **MonadVal** *r* 

### Return:

* **MonadVal** 

## MonadDict.const(a, arg)

Short equivalent to: `(a,arg) => M.apply(a, () => arg)`, but some 
implementations may override it to implement something more effective.

Default implementation uses `apply`.

### Params:

* **MonadVal** *a* value to apply to
* **Any** *arg* value to use in result instead

### Return:

* **MonadVal** 

## MonadDict.unshiftTo(a, arg)

Short equivalent to: `(a,arg) => M.apply(a, (v) => arg.unshift(v), arg)`

Default implementation uses `apply`

### Params:

* **MonadVal** *a* 
* **Array** *arg* 

### Return:

* **MonadVal** 

## MonadDict.unpack(v)

For wrapped monadic values with will return value stored in it.

### Params:

* **MonadVal** *v* 

### Return:

* **MonadVal** 

## M.run(defs, fun)

Calls `run` from current context.

### Params:

* **MonadDict** *defs* definitions for monad to run
* **Function** *fun* function to be executed inside monad context `defs`

## M.spread(f)

Simple replacement for ES2015 arguments spread. Takes function receiving 
set of arguments to a function receiving array. It is used in generated 
code.

### Params:

* **Function** *f* function taking a few arguments

### Return:

* **Function** function taking single input argument

## M.pure(value)

Calls current context `pure` method.

### Params:

* **Any** *value* 

### Return:

* **MonadVal** 

## M.raise(value)

Calls current context `raise` method.

### Params:

* **Any** *value* 

### Return:

* **MonadVal** 

## M.coerce(f)

Coercing values and exceptions. It wraps function `f` call with try-catch
statement and in case of exception turns it into `M.raise` or applies
value coercion procedure in case of no exceptions.

### Params:

* **Function** *f* 

### Return:

* **MonadVal** 

## M.apply(v, f)

Calls current context `apply` method

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## M.bind(v, f)

Calls current context `apply` method

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## M.arr(v)

Calls current context `arr` method.

### Params:

* **Array** *v* 

### Return:

* **MonadVal** 

## M.block(body)

Calls current context `block` method.

### Params:

* **Function** *body* 

### Return:

* **MonadVal** 

## M.scope(body)

Calls current context `scope` method.

### Params:

* **Function** *body* 

### Return:

* **MonadVal** 

## M.reify(arg)

Calls current context `reify` method.

### Params:

* **Function** *arg* 

## M.repeat(body, arg)

Calls current context `repeat` method.

### Params:

* **Function** *body* function to iterate
* **Any** *arg* first iteration argument

### Return:

* **MonadVal** 

## M.forPar(test, body, upd, arg)

Calls current context `forPar` method.

### Params:

* **PureFunction** *test* returns true if another iteration must be executed
* **Function** *body* the loop's body
* **PureFunction** *upd* updates iterator variables
* **Any** *arg* initial value of iterator

### Return:

* **MonadVal** 

## M.empty()

Calls current context `empty` method.

### Return:

* **MonadVal** 

## M.alt(args)

Calls current context `alt` method.

### Params:

* **Array** *args* 

### Return:

* **MonadVal** 

## M.addMethods(proto, overwrite)

Adds methods to a monadic value prototype. They redirect calls
into `this.mcontext` field. Where monad definition is to be stored.

### Params:

* **Object** *proto* prototype to agument
* **Bool** *overwrite* if true it will add monadic methods even if                         they are already defined

## completePrototype(monad, proto, overwrite)

Adds methods to a monadic value prototype. They redirect calls
into `this.mcontext` field and initializes the field with `defs`.

### Params:

* **MonadDict** *monad* definition to use
* **Object** *proto* prototype to agument
* **Bool** *overwrite* if true it will add monadic methods even if                         they are already defined

### Return:

* **MonadDict** 

## M.withControlByToken(inner)

Adds default implementation of control operators and exception if 
they are not defined already. 

The implementation uses token threading approach. There on each binding
or exception handling input value is checked to match special token type.
If it doesn't match default action is performed but if it does it is either
passed further in case of `bind` or may execute an action for example
for `finally`.

### Params:

* **MonadDict** *inner* monad definition to add new functionality to

### Return:

* **MonadDict** monad definition with the new functionality

## M.addContext(inner)

Modifies each higher order function to store current monad definition
in global context variable.

See: M.liftContext

### Params:

* **MonadDict** *inner* monad definition to add new functionality to

### Return:

* **MonadDict** monad definition with the new functionality

## M.defaults(inner)

Combination of control by token and context. 

### Params:

* **MonadDict** *inner* original monad definition

### Return:

* **MonadDict** 

## M.wrap(inner, Wrap)

Takes monad definition and generates another definition where each definition
is wrapped with another constructor `Wrap`. The `Wrap` constructor should 
construct an object with `inner` field pointing to original monadic value.

This is needed to avoid monadic value prototype pollution if there are a few 
monads implementations for the same type or the type is too generic, like
Function.

### Params:

* **MonadDict** *inner* original monad definition
* **Function** *Wrap* wrap constructor for wrapper

### Return:

* **MonadDict** 

## M.setContext(monad)

Sets global context.

Do not use it unless whole project uses single monad. 

### Params:

* **MonadDict** *monad* definition to store

## M.withContext(ctx, func)

Runs function fun within global context is initialized to `ctx` and after
finishing reverts it back.

### Params:

* **MonadDict** *ctx* 
* **Function** *func* 

### Return:

* **Any** result of `func` application

## M.liftContext(ctx, func)

Turns a function into a function initializing global context to `ctx`
and reverting it to the old value on exit.

### Params:

* **MonadDict** *ctx* 
* **Function** *func* 

### Return:

* **Function** 

<!-- End index.js -->
