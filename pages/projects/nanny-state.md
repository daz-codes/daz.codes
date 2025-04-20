---
summary: A tiny state library for building reactive UI.
  - state
  - javascript
  - projects
---

# Nanny State

NANNY STATE is a small reactive state library that makes it simple to build speedy web apps.

It does everything React does, but without the build process, JSX or a virutal DOM ... and it's a fraction of the size!

SMALL - less than 4kb minified and zipped
SIMPLE - a single state object with some useful helper methods
SPEEDY - automatic page renders that are blazingly fast

It uses a purely declarative notation and everything is written in Vanilla JS and HTML. To get started, just set the initial state and write the view - check out the example below:

```javascript
// A single import is all that's needed
import Nanny from "nanny-state"

// View is a tag function that accepts the state as a parameter and returns plain old HTML
const View = state => state.HTML`
  <h1>❤️ ${state.count}</h1>
  <div>
    <button onclick=${event => state.Decrement("count")}>👎</button>
    <button onclick=${event => state.Increment("count")}>👍</button>
  </div>`

// the initial State is just a plain old object 
const State = { 
  count: 0, 
  View
}

// Start the Nanny State!
Nanny(State)
```

