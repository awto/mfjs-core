# mfjs-core

Library provides utilities for implementing monads with interfaces compatible
with [mfjs compiler](https://github.com/awto/mfjs-compiler). 

It doesn’t implement any concrete effects but it contains tools for monads
construction used by in other libraries.

Monad is encoded in the library using simple object with a set of functions
for operations. It exports a prototype with a set of default implementations
as `MonadDict`. There are also a few transformers for definitions. They add
some common boilerplate features into concrete monad definitions.

Library stores global context with current monad definition to allow usage of
several monads within same project. There are `M.setContext`, `M.liftContext`,
`M.withContext` function to manage its value. To add context management into
some definition use `M.addContext` transformer.

Because of global context storing it is critical only single instance of the
library is loaded at the moment, for example using peer dependencies.

The generated code expects some functions to be method of monadic values.
To add default implementations to prototype of monadic value use `M.addMethods`
and `M.completePrototype` functions.

Sometime same data type may be used as monadic value of several monads, or
developer simply doesn't want to pollute some probably external type with
more prototype methods. To avoid this use `M.wrap` function.

`M.withControlByToken` transformer implements JS control operators using
special value threading through monad steps and probably ignoring or changing
behavior of some of them.

For more information about mentioned functions check [API reference](doc/api.md).



## LICENSE

License

Copyright © 2016 Vitaliy Akimov

Distributed under the terms of the The MIT License (MIT).


