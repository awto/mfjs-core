

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

See: M.iteratorBuf for iterator interface description

### Params:

* **Object** *args* 

### Return:

* **Iterator** 

## M.iterator(arg)

Adapts interface from ES iterators to mfjs compatible. The resulting 
iterator still uses ES mutable one, so each step invalidates previous
iterator. `M.iteratorBuf` may be used to make immutable one.

See: M.iteratorBuf for iterator interface description

### Params:

* **Any** *arg* iterable value (has `Symbol.iterator` method)

### Return:

* **Iterator** 

## M.iteratorBuf(arg)

Returns immutable mfjs iterator from iterable value. It buffers passed values
allowing to return back to some position. There is a special implementation 
for arrays without buffering.

The returned iterator is a function, calling it either
returns null if there are no other values or another function for next 
value with current value in field `value`. There returned iterator is 
immediately focused on the first element (so the function may return null) 
if input collection is empty.

### Params:

* **Any** *arg* iterable value (has `Symbol.iterator` method)

### Return:

* **Iterator** 

## M.completeMonad(initial)

Simply copies all definitions from one definition to another.

If a few monad definitions are used in a program it is worth 
they are cloned first to get same hidden class. 

### Params:

* **MonadDict** *initial* definitions

### Return:

* **MonadDict** complete definition

## M.completeMonad(initial)

Adds not implemented methods for monad definition object

### Params:

* **MonadDict** *initial* definitions

### Return:

* **MonadDict** complete definition

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

Function to call at top level to get final result.

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

Constructs monadic value with inner value `v`.

### Params:

* **Any** *value* 

### Return:

* **MonadVal** 

## M.raise(value)

Constructs monadic value representing exception.

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

Applies function `f` to monad inner value and returns monad with the same 
structure but with inner value substituted by result of `f(v)`.

Default implementation uses `bind` and `pure`.

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## M.bind(v, f)

Applies inner value of monadic value `v` to function `f`.

Default implementation uses `join` and `apply`.

### Params:

* **MonadVal|Any** *v* 
* **Function** *f* 

### Return:

* **MonadVal** 

## M.finally(a, f)

Executes function `f` and runs monadic value returned after
running `a` regardless it is succeed or raised exception.
Default implementation uses `bind`, `raise`, `handle`.

### Params:

* **MonadVal** *a* 
* **Function** *f* 

### Return:

* **MonadVal** 

## M.join(v)

Takes monadic value of monadic value of some type and returns monadic
that type.

Should be equivalent to:

     v => bind(v, (i) => i)

Default implementation uses `bind`.

### Params:

* **MonadVal** *v* 

### Return:

* **MonadVal** 

## M.pair(a, b)

Helper function to simplify `arr` implementation. It only takes two monadic 
arguments and must return monadic value of two elements array with inner
values of arguments.

Default implementation uses `bind` and `apply` or `arr`.

### Params:

* **MonadVal|Any** *a* 
* **MonadVal|Any** *b* 

### Return:

* **MonadVal** 

## M.arr(v)

Converts array of monadic values to monadic value of array of their inner 
values.

Default implementation uses `pure`, `apply` and `pair`.

### Params:

* **Array** *v* 

### Return:

* **MonadVal** 

## M.block(body)

Executes function `body` passing it another function as arguments. 
Calling the passed function will exit the block with value provided as 
its argument.

No default implementation.

### Params:

* **Function** *body* 

### Return:

* **MonadVal** 

## M.scope(body)

Same as `M.block` but used in top level of functions for `return` and `yield`.
Default implementation simply redirects to `block`.

### Params:

* **Function** *body* 

### Return:

* **MonadVal** 

## M.reify(arg)

This is a compiler directive making it not to treat result value
as effectful and not translate it into pure one. But some monads
implementations may also do something else here.

### Params:

* **Function** *arg* 

### Return:

* **Any** 

## M.reflect(arg)

This is a compiler directive for embedding monadic values. From 
original code perspective it converts monadic value into pure.

### Params:

* **MonadVal** *arg* 

### Return:

* **Any** 

## M.repeat(body, arg)

Simply executes function `body` infinitely, the function receives `arg`
as argument of the first iteration and on next iteration it uses result
of the previous for this.

Default implementation uses `bind`, `coerce`.

### Params:

* **Function** *body* function to iterate
* **Any** *arg* first iteration argument

### Return:

* **MonadVal** 

## M.forPar(test, body, upd, arg)

Simplified encoding of `for` statement.

It is assumed each iteration doesn't depend on another so they may be run
in parallel. The `arg` parameter is passed to all functions on the first 
iteration, and on next iterations result of `upd` is used instead.

Default implementation uses `bind`, `pure`.

### Params:

* **PureFunction** *test* returns true if another iteration must be executed
* **Function** *body* the loop's body
* **PureFunction** *upd* updates iterator variables
* **Any** *arg* initial value of iterator

### Return:

* **MonadVal** 

## M.empty()

Returns monad without answers for monads implementing Alternative interface.

Default implementation uses `alt`.

### Return:

* **MonadVal** 

## M.alt(args)

Takes arbitrary number of monadic values, concatenates them into single 
monadic value returning all these answers. 

Default implementation uses `plus` and `empty`.

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

## MonadDict.opt(args)

Optional value. For monads implementing Alternative interface
it returns monadic value with number of answers in v + one 
undefined answer.
Default implementation uses `plus` and `pure`.

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

## M.addControlByToken(inner)

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

## M.addCoerce(inner)

Adds coercing to all function's result expecting monadic value

### Params:

* **MonadDict** *inner* monad definition to add new functionality to

### Return:

* **MonadDict** monad definition with the new functionality

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

## M.defaults(inner, options)

Runs definitions transformations based on specified set of options.

Options:
* wrap - constructor function used for wrapped value, 
         it should construct objects with inner field
* context - boolean or "run" string for only wrapping run method,
            default is true
* coerce - boolean for adding coercions to functions returning 
           monadic values, default is true
* control - string "token" for adding control operators implementation
            using special token passing

### Params:

* **MonadDict** *inner* original monad definition
* **Object** *options* 

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

## M.Monad

Monadic value taking function's definitions from global context

### Params:

* ** 

## wrapGlobal(def)

Wraps monadic values in `M.Monad` objects

### Params:

* **MonadDict** *def* 

### Return:

* **MonadDict** 

<!-- End index.js -->

