---
title: Advent of Code 2025
author: DAZ
summary: My thoughts on the Advent of Code challenges at the end of last year
date: 22/1/2026
draft: true
tags:
  - rubymonkey
  - javascript
  - ruby
  - adventofcode
  - aoc
---

I'd never heard of Advent of Code before I joined Yozu, so this was the second time I had taken part in trying to complete the challenges. Last year I achieved 42/50 of the stars available.

The 2025 Advent of Code changed the format a little bit from the year before. There were only 12 days of challenges rather than the usual 25. These took place from December 1st to December 12th, so there was still one every day and it was a tough pace to keep up with. Each day still had a part a (usually quite easy) and part b (harder with varying degrees of difficulty), with a star awarded for completing each part, making a total of 24 stars available this year.

I liked this new format - it has a nice link to the Twelve Days of Christmas and made it much more manageable to keep up with the challenges. It also meant there was more time to complete any unfinished challenges in the weeks before Christmas

This year I decided to use Ruby Monkey to complete the challenges. I used JavaScript last year, but did some in Ruby and found that Ruby had some really nice methods that helped make solving the challenge easier and more enjoyable. In fact this was one of the reasons I decided to make Ruby Monkey. Completing this challenges using the library would show that it was able to be used to write real code.
Loved it - some really nice Code
Give an example

For example this was some of the code I used for the Day 12 challenge:

```javascript
const day12 = data => {
  const regions = data.trim().split("\n")
  return regions.count(region => {
    const [dimensions,presents] = region.split(": ")
    const area = dimensions.split("x").map($`to_i`).inject((P,n) => P*n)
    const result = presents.split(" ").map($`to_i`).map((n,i) => n * 7).sum
    return result < area
  })
}
```

This uses my [template to func]() function with `map` and `to_` to convert an array of number strings to type `Number`. It also uses the `count` Array method, which is much more intuitive than using `reduce` with some unitelligable logic or using a `for` loop with imperative code. Speak of `reduce`, I've also used `inject` which is just an alias for `reduce` and also used the `sum` method to find the total of all the results.

Overall I just feel that this makes the code look nicer as well as being much easier to work with. A big win for Ruby Monkey!

The actual challenges were a good standard. I usually managed to get part A smushed within an hour of looking at it in the morning and then would usually spend the rest of the day on part B. I'd often have to think about it then try some ideas out before finally getting a solution that worked. A frustrating situation is when your code works for the example data given, but not for the actual challenge data, usually due to some edge cases.

Then suddenly on Days 9 and 10, the level of challenged increased exponentially! Part B for both days was ridiculously hard!
Techniques used
Developed my own mini simultaneous equation solver!

Yozu leaderboard

Finished them all for the first time.
The last star is the easiest!
