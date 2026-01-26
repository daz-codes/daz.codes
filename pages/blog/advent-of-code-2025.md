---
title: Advent of Code 2025
author: DAZ
summary: My thoughts on the Advent of Code challenges at the end of last year
date: 25/1/2026
tags:
  - rubymonkey
  - javascript
  - ruby
  - adventofcode
  - aoc
---

This was the second time I've taken part in the Advent of Code challenge. Last year I achieved 42/50 of the stars available.

The 2025 Advent of Code changed the format a little bit from the year before. There were only 12 days of challenges rather than the usual 25. These took place from December 1st to December 12th, so there was still one every day and it was a tough pace to keep up with. Each day still had a part a (usually quite easy) and part b (harder with varying degrees of difficulty), with a star awarded for completing each part, making a total of 24 stars available this year.

I liked this new format - it has a nice link to the Twelve Days of Christmas and made it much more manageable to keep up with the challenges. It also meant there was more time to complete any unfinished challenges in the weeks before Christmas

This year I decided to use Ruby Monkey to complete the challenges. I used JavaScript last year, but did some in Ruby and found that Ruby had some really nice methods that helped make solving the challenge easier and more enjoyable. In fact this was one of the reasons I decided to make Ruby Monkey. Completing this challenges using the library would show that it was able to be used to write real code.

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

This uses my [template to func](/blog/template-to-func) function to pass each element in the `dimensions` and `presents` arrays to the`to_i` method to convert an a number string to type `Number` (so "24" will become `42`). It also uses the `count` Array method, which is much more intuitive than using `reduce` with some unitelligable logic or using a `for` loop with imperative code. Speak of `reduce`, I've also used `inject` which is just an alias for `reduce` and also used the `sum` method to find the total of all the results.

Overall I just feel that this makes the code look nicer as well as being much easier to work with. A big win for Ruby Monkey!

The actual challenges were a good standard. I usually managed to get part A smushed within an hour of looking at it in the morning and then would usually spend the rest of the day on part B. I'd often have to think about it then try some ideas out before finally getting a solution that worked. A frustrating situation is when your code works for the example data given, but not for the actual challenge data, usually due to some edge cases.

Then suddenly on Days 9 and 10, the level of challenged increased exponentially! Part B for both days was ridiculously hard! I quickly realised that on Day 9 I could reduce the problem down to simultaneous equations but didn't count on there being free variables and needing to implement my own row reduciton and Gaussian elimination functions. It took a long time to get right, especially having to ensure that only positive integers were used, but I was really pleased when I finally got this right. Day 10 also called for some maths. I needed to implement a function that used ray casting to check if a point was inside a shape or not, but there were so many edge cases and I hadn't counted on the strange way the shapes could be constructed. I eventually got something working with the test data but couldn't get it to solve the actual problem. In the end I was grateful for numerous Reddit posts that gave more sample data to highlight the edge cases. I wasn't as pleased with my solution to this, it seemed a bit hacky, but this was the second to last problem I needed to solve and by that point I just wanted to get it finished.

The last challenge that needed to be solved was part B on the last day. This is actually the easiest to solve as it just requires you to have solved all the other challenges and then click on a link to get the star. This meant that I got all the stars for the first time!

The devs at [Yozu](https://yozu.co.uk) have a leaderboard for Advent of code every year and it can get really competitive (well I do anyway!) I love trying to be the first to solve the challenge that day and would get up early each day to try and be the first to get both stars! In the end I managed to finish at the top of tbe table which I was really pleased about given how talented all the devs at Yozu are. Hopefully I'll be able to keep up my form next year as well!
