---
summary: A tiny library that makes HTML interactive. It was inspired by AlpineJS and HTMX and does most of what they do but with a much smaller footprint. Also a drop-in lighter and more feature-rich replacement for Stimulus.
position: 1
tags:
  - projects
  - javascript
  - surge
---

[Source Code](https://github.com/daz4126/helium)

Helium is an ultra-light library that makes HTML interactive!

Here's a simple example of a button that counts the number of times it has been clicked and turns red after more than 3 clicks:

```html
<button @click="count++" :style="count > 3 && 'background: red'">
    clicked <b @text="count">0</b> times
</button>
```

It's really simple to use - just sprinkle the magic @attributes into your HTML and watch it come alive!

## Why Helium?

Helium is designed for developers who want:

**Lightweight** - Just over 3KB minified and gzipped
**Powerful** - Declarative JavaScript in your HTML
**Zero build step** - Works directly in the browser with no compiling
**Easy to learn** - If you know HTML and basic JavaScript, you're ready
