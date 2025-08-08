---
title: Writing a Find Element Method for Stimulus
author: DAZ
summary: Writing a couple of new methods for Stimulus Controllers
tags:
  - stimulus
  - javascript
  - rails
  - hotwire
---

While working on a [kata](https://github.com/MerseyRails/merseyrails-kata-1) for the recent [Mersey Rails](https://merseyrails.com) meet up, me and a colleague were a bit unhappy with how our solutions looked because they had Stimulus controllers that used `document.getElementById` and `this.element.querySelector`, both of which didn't feel very 'stimulus-like'. It was made worse by the fact that using the classes API only returns the name of the class rather than the selector needed, leading to code like this:

```javascript
const el = this.querySelector(`.${this.activeClass}`)
```

Having to use a template literal to preprend the '.' to the start also felt cumbersome.

We both agreed that it would be much nicer if the Stimulus API provided a method that would find elements based on the class names ... something like this:

```javascript
const el = this.find(this.activeClass)
```

It would be aware that `this.activeClass` was a class and prepend the '.' for you.

I did a bit of digging and found that the `Scope` class in Stimulus already has two methods called `findElement` and `findAllElements` ... these basically provide a wrapper around `this.element.querySelector` and `this.element.querySelectorAll` so ensure they are scoped to the element, but they are only accessible from a controller using `this.scope.findElement` and `this.findAllElements`.

So I decided to patch these methods into the `Controller` class as well as automatically prepending a '.' in front of any classes provided using the class API. While I was at it, I added the ability to search for an ID if one exists. This means that you can do the following, given the this HTML:

```html
<div data-controller="my-controller"
      data-my-controller-active-class="active"
      data-my-controller-loading-classes="busy loading"
    >
      <div id="inside">This is inside</div>
      <div class="busy loading">This is loading</div>
      <div class="active"><p class="intro">This is the intro</p></div>
    </div>
    <div id="outside" class="busy">This is outside</div>
```

You can find Elements scoped inside the root element by passing the id:

```javascript
this.findElement("inside")
```

 This will return  `<div id="inside" class="busy loading">...</div>`

```javascript
this.findElement("outside")
,,,`

This will return  `undefined` since it doesn't match any element inside the controller

You can find elements using defined classes:

```
this.getElement(this.activeClass)
```
This will return  `<div class="active">...</div>`

```javascript
this.getElement(this.loadingClasses)
```

This will return `<div class="busy loading">...</div>`

You can also find elements using a standard query selector:

```javascript
this.getElement(.active p.intro)
```

This will return `<p class="intro">...</p>`

The method looks for items with an id first, then looks to see if any classes have been defined on the controller and last of all falls back to using `this.element.querySelector`

`this.findAllElements` works in the same way, but returns an array of all matching elements. It does **not** look for elements with an id as there should only be one element with an id.

The key addition was this private method that checks to see if the string passed is stored in `this.classes` and if it is will prepend the '.' automatically:

```javascript
private classifySelector(selector: string | string[]): string {
    const tokens = Array.isArray(selector) ? selector : [selector]

    const definedClasses: string[] = (this.constructor as any).classes.flatMap((key: string) => {
      const value = (this as any)[`${key}Classes`] as string[] | undefined
      return value ?? []
    })

    const allTokensDefined = tokens.every((token) => definedClasses.includes(token))
    return "." + tokens.join(allTokensDefined ? "." : " ")
  }
````

I submitted a [PR to add this Stimulus](https://github.com/hotwired/stimulus/pull/854) ... hopefully it will get accepted!
