---
title: Ruby Number Methods
author: DAZ
summary: A summary of some nice methods for numbers in Ruby
tags:
  - rubydoo
  - javascript
  - ruby
---

One of the biggest advantages of making the [Ruby Doo](/projects/ruby-doo) library was going through all of the Ruby methods for numbers, strings, arrays and hashes. I learnt about so many methods I had no idea existed and discovered some really useful ones. In this post I'm going to look at some of my favourites.

## `between?`

This lets you check if a number is between 2 values inclusive.

So instead of this:

```ruby
  n >= 10 && n <= 20
```

You can just write:

```ruby
  n.between?(10,20)
  => true
```

## `digits`

This simply returns an array of the digits in the number, from smallest to largest.

```ruby
29.digits
=> [9,2]
```

## `gcd` and `lcm`

These stand for *greatest common divisor* and *lowest common multiple* respectively.

The GCD of two (or more) numbers is the highest number that is a divisor (or factor) of all the numbers provided, so for example:

```ruby
8.gcd(12)
=> 4
```

This is because the common divisors of 8 and 12 are 1,2 and 4 ... and 4 is the highest.

If two numbers are *coprime* then their GCD will be 1:

```ruby
12.gcd(25)
=> 1
```

The LCM of two numbers is the lowest number that is a multiple of them both, in the game FIZZ BUZZ this will be the first number you say FIZZ BUZZ on:

```ruby
3.lcm(5)
=> 15
```

When numbers are coprime the LCM is just the product of the two numbers, but it gets trickier when they have common factors:

```ruby
12.lcm(30)
=> 60
```

## `ordinalize`

This one is actually only in Rails as it's part of Active Support, but it's nice to use.

This will just return a string with the correct suffix appended to the number, for example:

```ruby
1.ordinalize
=> "1st"
```

Always useful if you're dealing with positions etc.
