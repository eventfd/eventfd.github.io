---
title: "Fold Scan Fusion"
date: "2026-01-02"
summary: "Exploring the Fold Scan Fusion property"
toc: true
math: false
readTime: true
autonumber: false
tags: ["haskell"]
showTags: false
hideBackToTop: false
---

There's a very interesting property when it comes to `scan` and `fold`.

```haskell{title="Definition"}
foldl f f0 . scanl g g0 === foldl h (f f0 g0, g0)
  where h (x, y) e = (f x (g y e), g y e)
```

Feel free to [skip](#explanation) the following section if you are familiar with `fold`s and `scan`s.


## Definition

```text{title="scanl"}
def scanl(iter: Iterable[T], init: A, pred: Fn(A, T) -> A) -> Iterable[A] {
  for e in iter {
    yield init
    init = pred(init, e)
  }
}
```
```text{title="foldl"}
def foldl(iter: Iterable[T], init: A, pred: Fn(A, T) -> A) -> A {
  for e in iter {
    init = pred(init, e)
  }
  return init
}
```

`fold` folds the iterable using `pred` as the function *accumulating* result on the way, whereas `scan` returns an iterable consisting of the intermediate results.

There are two variants of fold - `foldl` and `foldr`. The main difference is in the associativity, that is., `foldl` consumes the iterator from the beginning whereas `foldr` consumes it from the end.


## Explanation

Consider the following expression,

```
rv = fold(scan(list, g0, g), f0, f)
```

Let's do a dry run here. Say, the elements of the list are denoted by $e_i \forall \ 0 \le i \lt n$ where $n$ represents the number of elements in the `list`

The output of `scan` is $$s = \left[g_0, g(g_0, e_0), g(g(g_0, e_0), e_1), \cdots \right]$$

Now we apply fold to the new set of values:

| $i$ | $s_i$ | $rv_i$ |
| --- | --- | --- |
| $0$ | $g_0$ | $f_0$ |
| $1$ | $g(s_0, e_0)$ | $f(rv_0, s_0)$ |
| $2$ | $g(s_1, e_1)$ | $f(rv_1, s_1)$ |
|$\cdots$ | $\cdots$ | $\cdots$ |
| $k-1$ | $g(s_{k-2}, e_{k-2})$ | $f(rv_{k-2}, s_{k-2})$ |
| $k$ | $g(s_{k-1}, e_{k-1})$ | $f(rv_{k-1}, s_{k-1})$ |

Observe that $rv_i$ is lagging behind $s_i$ as $s_i$ depends on $e_{i-1}$ whereas $rv_i$ depends on $s_{i-1}$ thereby depending on $e_{i-2}$. Shifting up by one row for $rv_i$, we get

| $i$ | $s_i$ | $rv_{i+1}$ |
| --- | --- | --- |
| $0$ | $g_0$ | $f(rv_0, s_0)$ |
| $1$ | $g(s_0, e_0)$ | $f(rv_1, s_1)$ |
| $2$ | $g(s_1, e_1)$ | $f(rv_2, s_2)$ |
|$\cdots$ | $\cdots$ | $\cdots$ |
| $n-1$ | $g(s_{n-2}, e_{n-2})$ | $f(rv_{n-1}, s_{n-1})$ |

We get the following pseudocode
```
(s, rv) = (g[0], f(f[0], g[0]))
for e in list {
  s = g(s, e)
  rv = f(rv, s)
}
```

If we keep a track of the pair `(s, rv)` at every iteration, we can reduce it into a single fold `h`

Where `h` can be defined as

```
def h(s: A, rv: B, e: E) -> (A, B) {
  s' = g(s, e)
  rv' = f(rv, s')
  return (s', rv')
}
```

Alright, let's run a quick property test

```haskell
import Test.QuickCheck

foldScan f g f0 g0 = foldl f f0 . scanl g g0

fusedScan f g f0 g0 = snd . foldl h (g0, f f0 g0)
  where h (s, rv') e = (g s e, f rv' (g s e))

foldFusion :: (Eq a, Show a) => (a -> b -> a) -> (b -> p -> b) -> a -> b -> [p] -> Property
foldFusion f g f0 g0 xs = foldScan f g f0 g0 xs === fusedScan f g f0 g0 xs

-- define the concrete types for a sample property testing
propFoldFusion :: Fun (Int, Int) Int -> Fun (Int, Int) Int -> Int -> Int -> [Int] -> Property
propFoldFusion (Fn2 f) (Fn2 g) = foldFusion f g

main :: IO ()
main = do
  quickCheck propFoldFusion
```

And, here's the output:

```shell
$ stack test
...
testing> test (suite: testing-test)
                     
+++ OK, passed 100 tests.

testing> Test suite testing-test passed
Completed 2 action(s).
```


## References

- `Algebraic Identities for Program Calculation` by Richard Bird
