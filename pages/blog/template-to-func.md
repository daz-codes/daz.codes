---
title: Template to Func
author: DAZ
summary: A neat little helper function that mimics the Symbol to Proc method in Ruby
date: 13/06/2025
tags:
  - rubydoo
  - javascript
  - ruby
---

Wahhhhh at work, somebody posted this JavaScript snippet, saying they liked how the `some` method worked:

```javascript
const anyChecked = filterTargets.some(filter => filter.checked)
````

Someone replied, saying they preferred how to do it in Ruby:

```ruby
any_checked = filter_targets.any?(&:checked)
```

I had already implemented the `any` in my [Ruby Doo](/projects/ruby-doo) library, but I also like the way you can use the [symbol to proc](https://www.mintbit.com/blog/rubys-symbol-to-proc-shorthand-method-name/) shorthand notation in Ruby to automatically call a method on each element passed to it. Interesting fact that this was originally a Rails method that was then merged into Ruby core as it proved so useful. It does seems a lot of needless code writing `filter => filter.checked` when all you want to do is apply a method to each element in the array.

JavaScript already allows you to use a [point free](https://en.wikipedia.org/wiki/Tacit_programming) style where you can just provide the name of a function and each element in the array will be passed to it, so we could do this:


```javascript
const filterChecker = filter => filter.checked
const anyChecked = filterTargets.some(filterChecker)
````

But in this case, we have just shifted the problem to defining a trivial function, `filterChecker`, that simply calls a method on the object provided to it. The problem arises if you are doing a lot of OOP style coding, then you will often be calling methods on objects rather than top-level functions. I wondered if it was possible to implement something similar to Ruby's symbol to proc in Ruby Doo.

My first effort looked like this:

```javascript
const sym_to_proc = method => obj => obj[method]
```

This is a [curried](https://javascript.info/currying-partials) function that uses [partial application](https://barker.codes/blog/currying-and-partial-application-in-javascript/) to return another function that can then be passed as a callback to the array method. This means you coudl write this:

```javascript
const anyChecked = filterTargets.some(sym_to_proc("checked"))
````

This looks a bit messy though ... the Ruby version uses the ampersand to start the call and it's just followed by a symbol. Having to use the extra parentheses to call the function is also messy. So I got creative ... JavaScript doesn't have symbols, but it *does* have [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), and they don't require parentheses when you call a function with them as the argument ([tag functions](https://codeburst.io/javascript-what-are-tag-functions-97682f29521b)). Unfortunately you can't use an ampersand for a function name, but as jQuery showed, you can use  `$`, so I rewrote the function as this:

```javascript
const $ = method => obj => obj[method]
```

Now we can call it like this:

```javascript
const anyChecked = filterTargets.some($`checked`)
````

... which, while not exactly the same, is much closer to the Ruby version.

So I added it to an updated version of Ruby Doo, so now you can write this:


```javascript
const anyChecked = filter_targets.any($`checked`)
````

I'm not sure how much it would get used, but it was fun to implement and is more useful when using Ruby Doo, which adds a lot more methods to JavaScript objects. I like the fact it uses tag template functions in a creative way and the use of the `$` is similar to the way it's used in [template literal interpolation](https://medium.com/@abhishekprasadkashyap/exploring-template-literals-javascripts-powerful-string-interpolation-5f62c1f04c0a). And I decided to call it **Template to Func**, in honour of the Ruby method that inspired it, since it uses template literals instead of symbols and functinos instead of procs.
