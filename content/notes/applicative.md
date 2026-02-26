+++
title = "Applicative"
summary = "Notes on Applicative"
date = "2026-02-26"
math = true
+++

## Applicative

```haskell
class Functor f => Applicative f where
    pure :: a -> f a
    (<*>) :: f (a -> b) -> f a -> f b
    liftA2 :: (a -> b -> c) -> f a -> f b -> f c
    (*>) :: f a -> f b -> f b
    (<*) :: f a -> f b -> f a
    {-# MINIMAL pure, ((<*>) | liftA2) #-}
```

1. Applicatives extend over curried functions. Why? Because `(->)` is associates from right.

Let `f1 :: a -> b -> c`. If we type match with `a -> b`, we get, `f1 :: a -> (b -> c)`. Thus 
```haskell
(<*>) :: f (a -> b -> c) -> f a -> f (b -> c)
```

2. `<*>` and `liftA2` are _functionally_ equivalent.

> A curried function (in a context) is applied with a value (in the same context) to get another curried function (in the same context).

3. Implement `liftA2` using `<*>`

- `liftA2` takes in a function without context i.e., we need to apply `pure`

```haskell
liftA2' :: (a -> b -> c) -> f a -> f b -> f c
liftA2' f a b = pure f <*> a <*> b
```

4. `liftA*` functions

```haskell
-- Control.Applicative module
liftA :: (Applicative f) => (a -> b) -> f a -> f b
liftA3 :: (Applicative f) => (a -> b -> c -> d) -> f a -> f b -> f c -> f d
```
