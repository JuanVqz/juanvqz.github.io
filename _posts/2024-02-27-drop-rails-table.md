---
layout: post
title: "How to Drop Rails Table"
date: 2024-02-27 09:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [rails]
---

> **Note:** Dropping a table will remove all the data from it.

I recently had to remove a table from a Rails application. Here are the ways to do it.

## Using a Migration

**Why this option?**

- It's a standard way to make database changes
- It's reversible, so you can rollback if needed (though data won't be recovered)

```bash
rails generate migration DropUsers
```

```ruby
class DropUsers < ActiveRecord::Migration[7.0]
  def change
    drop_table :users do |t|
      t.string :name
      t.string :email
      t.timestamps
    end
  end
end
```

I saw some blog posts that only use `drop_table :users`, but that's not reversible. You may see this error when rolling back:

```bash
To avoid mistakes, drop_table is only reversible if given options or a block (can be empty).

doctors/db/migrate/20240228054356_drop_users.rb:3:in `change'

Caused by:
ActiveRecord::IrreversibleMigration:

To avoid mistakes, drop_table is only reversible if given options or a block (can be empty).
```

Use a block to avoid the error.

## Using the Rails Console

**Why this option?**

- You don't want to track the change history

```ruby
bin/rails console
ActiveRecord::Base.connection.execute("DROP TABLE IF EXISTS users;")

# or using the helper method:

ActiveRecord::Migration.drop_table :users
```

## Using a Database Client

**Why this option?**

- You don't care about change history
- You don't have access to run Rails commands

Depending on the database you are using, you can use the client to drop the table.

For example, using the `psql` client for PostgreSQL:

```bash
psql -U username -d database_name
DROP TABLE IF EXISTS users;
```

[Here](https://github.com/JuanVqz/doctors/pull/466/files#diff-7e80a8047615e45e8edbf2f36d8cd899e929d16711bdeb78e22dbbbc8e2f13e0) you can see the pull request where I dropped the table.
