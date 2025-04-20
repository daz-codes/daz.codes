---
summary: A small utility library that helps make JavaScript do more Ruby.
  - ruby
  - javascript
  - rubydoobydoo
  - projects
---

# Ruby Doo

Ruby Doo was born out of my love for Ruby and frustration with JavaScript’s limited native methods. So I built my own utility library — not just as a fix, but as a fun way to bring Ruby’s elegance to the browser.

Unashamedly monkey patching JS numbers, strings, arrays and objects with Ruby methods.

Ruby has loads of really nice methods, now you can use them in JS as well!

Write code like:

```javascript
[1,2,3].last // 3
[1,2,3].count // 3 
(21).ordinalize // "21st"
"Rubydoobydoo".reverse //m "oodyboodybuR"
[1,2,3].sum.squared // 9
["A","A","C","A","B","A","B"].tally // {"A": 4, "C": 1, "B": 2}
```

## Ruby Dooby Doo!