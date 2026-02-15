+++
title = "Fold Scan Fusion"
date = "2026-02-14"
summary = "Fold Scan Fusion - an Optimized Iteration Pattern"
math = true
tags = ["math", "algorithms"]
toc = true
readTime = true
+++

## Context

As programmers or data-engineers working you might have encountered a pattern of the following type

1. Perform a cumulative accumulation of results on an array, say using a function $f$
2. Perform a total accumulation of results on this new array, say using a function $g$

### Examples

- Simulate how a router handles incoming packets when the outgoing bandwidth is capped.
    1. $f$ (Prefix Sum with Local Maximum): Given an array of incoming traffic minus outgoing capacity, you perform a cumulative sum. However, if the sum drops below zero (idle link), it stays at zero. This gives you the instantaneous queue size.
    2. $g$ (Monotone Partitioning): You perform a count of how many times the resulting values exceed the hardware buffer limit.

- Maximum Concurrent Users - where you might need to count, at any given time, maximum users who are logged in to a system.
  1. $f$ (Prefix Sum): You sort the events by time and perform a cumulative sum of the $+1$s and $-1$s. This gives you the number of active users at any timestamp.
  2. $g$ (Maximum): You find the maximum value of that new array to determine the Peak Concurrency, which dictates how much server capacity you need to provision.

## Standard Implementation

I am removing the generics and focussing on a specialized instance for ease of understanding.

```py {title = "Standard Implementation"}
from typing import Callable

def solve(input: list[int], f_init: int, f: Callable[[int, int], int], g_init: int, g: Callable[[int, int], int]) -> int:
    buf = list[int]()
    val = f_init
    for e in input:
        val = f(val, e)
        buf.append(val)
    rv = g_init
    for e in buf:
        rv = g(rv, e)
    return rv
```

### Problem

1. The Space Complexity is $O(len(input))$ - **wasted space**

## Fold-Scan Fusion Theorem

The theorem says 

```haskell
foldl g g_init . scanl f f_init === foldl h (g g_init f_init, f_init)
  where h (x, y) e = (g x (f y e), f y e)
```

Let's break it down to simple english:
1. Performing a scan using $\left (g,\ g_{init} \right )$ followed by fold using $\left (f,\ f_{init} \right )$ is equivalent to performing fold using $\left (h,\ h_{init} \right)$
2. $h_{init} = \left( f(f_{init},\ g_{init}),\ g_{init} \right)$
3. $h ((x,\ y),\ e) = \left(f(x,\ g(y,\ e)),\ g(y,\ e)\right)$

## Proof

1. Inspect `scan f`

| $i$ | $scan_i$ |
| --- | --- |
| $0$ | $\left [f(f_{init}, e_0) \right]$ |
| $1$ | $\left [f(f_{init}, e_0), f(f(f_{init}, e_0), e_1) \right]$ |
| $\cdots$ | $\cdots$ |
| $n-1$ | $\left [f(f_{init}, e_0), f(f(f_{init}, e_0), e_1) \cdots f^{n}((f_{init}, e_0), \cdots e_{n-1}) \right]$ |

2. Apply `fold g`

| $i$ | $fold_i$ |
| --- | ---- |
| $0$ | $g(g_{init}, scan_{n-1}[0])$ |
| $1$ | $g(fold_0, scan_{n-1}[1])$ |
| $\cdots$ | $\cdots$ |
| $n-1$ | $g(fold_{n-2}, scan_{n-1}[n-1])$ |

3. Expand value of $scan_{n-1}$

| $i$ | $fold_i$ |
| --- | ---- |
| $0$ | $g(g_{init}, f(f_{init}, e_0))$ |
| $1$ | $g(fold_0, f(f(f_{init}, e_0), e_1))$ |
| $\cdots$ | $\cdots$ |
| $n-1$ | $g(fold_{n-2}, f^{n}((f_{init}, e_0), \cdots e_{n-1}))$ |

If you see carefully, you will notice that the value of $f^{i-1}(...)$ is **reused** in the $i^{th}$ iteration. To prevent *recomputation*, we just need to **include this value into the state of fold**.

Thus the fold becomes

$$
g'((g_i,\ f_i),\ e) = ( g(g_i,\ f(f_i,\ e)),\ f(f_i,\ e) )
$$

This is exactly what the theorem says.


## Optimized Implementation

```py {title = "Optimized Implementation"}
from typing import Callable

def solve(input: list[int], f_init: int, f: Callable[[int, int], int], g_init: int, g: Callable[[int, int], int]) -> int:
    def h(x, y, e):
        t = f(y, e)
        return g(x, t), t
    
    state = (g(g_init, f_init), f_init)
    for e in input:
        state = h(*state, e)
    return state[0]
```
