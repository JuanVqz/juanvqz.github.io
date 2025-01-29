---
layout: post
title: "How to Drop Rails Table"
date: 2024-02-27 09:00:00 -0500
last_modified_at: 2024-02-27 09:00:00 -0500
categories: [development]
tags: [rails]
author: Juan Vásquez
---

I recently had to remove a table from a Rails application, so, I want to share ways to do it.

> **Note:** Remember dropping a table will remove all the data from it.

## Using a Migration

**why this option?**

- It's a standard way to make changes to the database.
- It's reversible, so I can rollback the change if needed. (won't recover the data though).

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

I saw some blog posts that only use `drop_table :users`, but that is not reversible, you may see this error when rolling back:

```bash
To avoid mistakes, drop_table is only reversible if given options or a block (can be empty).

doctors/db/migrate/20240228054356_drop_users.rb:3:in `change'

Caused by:
ActiveRecord::IrreversibleMigration:

To avoid mistakes, drop_table is only reversible if given options or a block (can be empty).
```

use the block to avoid the error.

## Using the Rails Console

**why this option?**

- I don't want to track the history of the change.

```ruby
bin/rails console
ActiveRecord::Base.connection.execute("DROP TABLE IF EXISTS users;")

# or using the helper method:

ActiveRecord::Migration.drop_table :users
```

## Using a Database Client

**why this option?**

- I don't care about the history of the change.
- I don't have access to run Rails commands.

Depending on the database you are using, you can use the client to drop the table.

For example, using the `psql` client for PostgreSQL:

```bash
psql -U username -d database_name
DROP TABLE IF EXISTS users;
```

[Here](https://github.com/JuanVqz/doctors/pull/466/files#diff-7e80a8047615e45e8edbf2f36d8cd899e929d16711bdeb78e22dbbbc8e2f13e0) you can see the pull request where I dropped the table.
