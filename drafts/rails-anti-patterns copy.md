---
title: Elixir & Phoenix
author: DAZ
summary: A summary of some nice methods for numbers in Ruby
tags:
  - elixir
  - phoenix
  - installation
---

Install phoenix

This can be done with one line of code. It will also create a new app:

```
curl https://new.phoenixframework.org/myapp | sh
```

Check version:

```
mix phx.new --version
```

Run tests

```
mix tests
```

mix phx.gen.auth Accounts User users
mix deps.get
mix ecto.migrate

mix tests

Create a model, it needs a namespace (context name) and the model can't be called List because it's a reserved word (it's actually a module, not a model), but lists can be proved as the DB table name:

```
 mix phx.gen.live Priority TaskList lists name:string
```


Add routes for lists in `/lib/phoenix_priority_web/router.ex` You need to be authenticated to access them, so they go in the auth routes:

```
scope "/", PhoenixPriorityWeb do
    pipe_through [:browser, :require_authenticated_user]

    live_session :require_authenticated_user,
      on_mount: [{PhoenixPriorityWeb.UserAuth, :require_authenticated}] do
      live "/users/settings", UserLive.Settings, :edit
      live "/users/settings/confirm-email/:token", UserLive.Settings, :confirm_email
      live "/lists", TaskListLive.Index, :index
      live "/lists/new", TaskListLive.Form, :new
      live "/lists/:id", TaskListLive.Show, :show
      live "/lists/:id/edit", TaskListLive.Form, :edit
    end

    post "/users/update-password", UserSessionController, :update_password
  end
  ```
