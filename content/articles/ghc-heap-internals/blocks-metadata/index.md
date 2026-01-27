+++
title = "Part 1 - Addressing Blocks and Metadata"
date = "2026-01-26"
summary = "Addressing Blocks and Metadata"
tags = ["haskell"]
readTime = true
+++

### Problem Statement
> Given a pointer to a address inside a data block, how do we get pointer to the corresponding metadata?

### Terminologies

`Alignment`
: An address is said to be aligned at $2^n$ bytes if the address is a multiple of $2^n$

`Mega Block`
: A memory allocation of 1 MiB ($2^{20}$ bytes) aligned at 1 MiB

`Block`
: A chunk of memory 4 KiB ($2^{10}$ bytes) in size


## Mega Block Layout

* Memory is managed as mega-blocks of $1\ MiB$.  
* Each mega-block is further divided into page sized ($4\ KiB$) blocks.  
* The first four contiguous blocks store the metadata for the data blocks.
* Each metadata is $64$ bytes

![Mega Block](mega-block.svg#light)

So, the number of blocks is $\frac{1\ MiB}{4\ KiB} = 2^8 = 256$

Each of these blocks has a metadata associated.  
Therefore, the total metadata size is $$2^8 \times 64\ B = 2^{14}\ B = \frac{2^{14}}{2^{12}}\ blocks = 4\ blocks$$

Thus, the total number of data blocks is $256 - 4 = 252$

Since each block has a metadata entry, the above 4 metadata blocks would have 4 meta-metadata entries. These 4 metadata entryes do not store any information, thus we have:

| Data Block Index | Metadata Index | Data Block Offset | Metadata Offset |
| --- | --- | --- | --- |
| $D_0$ | 4 | $4 \times 2^{12}$ | $4 \times 64$ |
| $D_1$ | 5 | $4 \times 2^{12} + 2^{12} = 5 \times 2^{12}$ | $5 \times 64$ |
| $\cdots$ | $\cdots$ | $\cdots$ | $\cdots$ |
| $D_{251}$ | 255 | $255 \times 2^{12}$ | $255 \times 64 $


## Algorithm

It's easy to see that $\left \lfloor \frac{\text{data block offset}}{2^{12}} \right \rfloor$ would give the metadata index. Thus the metadata offset would be $\left \lfloor \frac{\text{data block offset}}{2^{12}} \right \rfloor \times 64$

> How do we get the data block offset?

Given $p$, pointer to a word in a data block, if we consider only the lower 20 bits (because 1 MiB is $2^{20}$ bytes), we get the offset to the word $p$ was pointing to. Now, we get the offset to the metadata block as

$$
\left \lfloor \frac{p_{19..0}}{2^{12}} \right \rfloor \times 2^6
$$

We can get the base address of the mega-block if if we clear the last 20 bits of $p$ to 0 (since haskell ensures the mega-blocks are allocated at $1\ MiB$ boundaries, that is the address is a multiple of $1\ MiB$).

Finally, the address of the metadata block is

$$
\begin{aligned}
&\left \lfloor \frac{p_{19..0}}{2^{12}} \right \rfloor \times 2^6 + p_{63..20} \times 2^{20} \\
&= p_{19..12} \times 2^6 + p_{63..20} \times 2^{20}
\end{aligned}
$$

Let's now try to put it in code

```c
#define MEGA_BLOCK_MASK (1 << 20)
#define BLOCK_MASK      (1 << 12)

/* take the least significant 20 bits */
#define MEGA_BLOCK_OFFSET(p)  ((p) & MEGA_BLOCK_MASK)

/* clear the least significant 12 bits */
#define MEGA_BLOCK_OFFSET_BLOCK_ALIGNED(p)  (MEGA_BLOCK_OFFSET(p) & ~BLOCK_MASK)

/* right shift by 6, as dividing by 2^12 then multiplying by 2^6 introduces 6 zeros after bit 12 of p */
#define METADATA_OFFSET(p) (MEGA_BLOCK_OFFSET_BLOCK_ALIGNED(p) >> 6)

/* clear the least significant 20 bits, as mega blocks are aligned at 1MiB multiple */
#define MEGA_BLOCK_BASE(p) ((p) & ~MEGA_BLOCK_MASK)

#define METADATA_ADDR(p) (MEGA_BLOCK_BASE(p) | METADATA_OFFSET(p))
```

this is exactly what the following snippet in [`rts/include/rts/storage/Block.h`](https://gitlab.haskell.org/ghc/ghc/-/blob/master/rts/include/rts/storage/Block.h#L188) does:

```C
#define Bdescr(p) \
    ((((p) &  MBLOCK_MASK & ~BLOCK_MASK) >> (BLOCK_SHIFT-BDESCR_SHIFT)) \
     | ((p) & ~MBLOCK_MASK))
```

## Benefits

- Zero Memory loads
- No branches
