---
title: Rails Anti-Patterns
author: DAZ
summary: A summary of some nice methods for numbers in Ruby
tags:
  - rubydoo
  - javascript
  - ruby
---

Last night I had the pleasure of hearing [Chad Pytel]() speak at NWRUG.

Chad is CEO of [Thoughtbot]() and author of [Rails Anti Patterns](). That book is now 10 years old and last night he revisited some of the antimpatterns that were dealt with in the book and invited us to reflect on what has changed in Rails in the last 10 years. It was a really interesting discussion and it was a shame we ran out of time.

## Responders

Telling an action how to respond to differen formats is a common pattern:

```

```

```
respond_to :html, :json
```

Then in the action all you need to write is this:

```
respond_with @thing
```

This was added in Rails 3 and removed not long after! It was felt it did too much so was abstracted into a gem (which still exists!)

It was generally felt that these days any api calls are hosted under an api. domain so this pattern isn't used as much, although a few of us broguht up that having multiple respond_to calls is happening a lot more again due to the use of Turbo Streams.

## Fat Controllers

Picture here ...

Fat controllers have been scorned since the early days of Rails, so it was no surprise when this came up.

## Fat Models

One of the repercussions of trying to slim down fat controllers is that a lot of the logic gets moved to the model ... and filling the model up with lots of code isn't great either.

Models that do too much was looked at and there was a good discussion about the use of service obejcts, concerns and ??

Was this when the Presenter pattern was mentioned?

## Denormalized Data

Chad finished by displaying 4 rules that were given in the book and invited any comments:

1.
2.
3.
4.

If you have have a User model and want an admin
Even if you want more you can
Obviously this changes if users can add different types, you will need to store it. I came upon this idea when building PR!OR!TY! ...
