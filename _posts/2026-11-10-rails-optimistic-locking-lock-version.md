---
layout: post
title: "Add a Column, Change Your App: Rails Optimistic Locking"
date: 2026-11-10 09:00:00 -0600
last_modified_at: 2026-11-10 09:00:00 -0600
categories: [rails]
tags: [rails, activerecord, concurrency, postgresql, locking]
---

## The problem nobody notices until they do

Two people open the same record. Both edit it. Both save.

```ruby
p1 = Person.find(1)
p2 = Person.find(1)

p1.first_name = "Michael"
p1.save

p2.first_name = "Should this win?"
p2.save
```

The second save wins, and the first person's change is gone. No error, no warning, nothing in the
log. Whoever clicked last is the author of the record now.

This is called a lost update, and it is one of those bugs that never appears in development because
you are the only person clicking.

Rails has shipped a fix for this since 2004. Most Rails developers I talk to have never used it.

## The whole feature is a column name

```ruby
add_column :people, :lock_version, :integer, default: 0, null: false
```

That is it. No `include`, no gem, no configuration, no declaration in the model. The model file
stays exactly as it was:

```ruby
class Person < ApplicationRecord
  # nothing here. optimistic locking is now active.
end
```

Run that second save again and you get:

```
ActiveRecord::StaleObjectError: Attempted to update a stale object: Person.
```

## Why a column changes behavior

The switch lives in Active Record's source, and it is two conditions:

```ruby
def locking_enabled?
  lock_optimistically && columns_hash[locking_column]
end
```

`lock_optimistically` defaults to `true` for every model. `locking_column` defaults to the string
`lock_version`. So the only thing standing between your app and optimistic locking is whether that
column exists in the table.

Once it does, Active Record changes the `UPDATE` it generates. Instead of:

```sql
UPDATE people SET first_name = 'Michael' WHERE id = 1;
```

you get:

```sql
UPDATE people
SET first_name = 'Michael', lock_version = 1
WHERE id = 1 AND lock_version = 0;
```

Read that `WHERE` clause carefully, because it is the entire mechanism. The update says "change this
row, but only if it is still on the version I read." If someone else already saved, the row is on
version 1, zero rows match, and Rails raises `StaleObjectError`.

No database lock is taken. Nothing blocks. Nobody waits. The conflict is detected after the fact
rather than prevented, which is why it is called optimistic.

## It is the exact string, not a prefix

A column called `lock_number` or `locking_version` does nothing at all. Active Record looks for one
name, defined as a constant:

```ruby
DEFAULT_LOCKING_COLUMN = "lock_version"
```

You can rename it per model:

```ruby
class Person < ApplicationRecord
  self.locking_column = :lock_person
end
```

Or turn the whole thing off:

```ruby
ActiveRecord::Base.lock_optimistically = false
```

But the convention is the default, and the default is the reason this feature surprises people.
Adding a column named `lock_version` for some unrelated purpose will quietly change how your model
saves.

## What you have to handle yourself

Rails detects the conflict. Deciding what to do about it is your job:

```ruby
def update
  @person.update!(person_params)
  redirect_to @person
rescue ActiveRecord::StaleObjectError
  @person.reload
  flash.now[:alert] = "Someone else changed this while you were editing. Here is the current version."
  render :edit, status: :conflict
end
```

If you skip this, `StaleObjectError` becomes a 500. That is worse than the lost update you were
trying to prevent, so wire up the rescue in the same commit that adds the column.

For the check to work across web requests, the version has to make the round trip through the form:

```erb
<%= form.hidden_field :lock_version %>
```

Without it, every request reads the current version fresh from the database, and the comparison
always passes. The feature appears to work and protects nothing.

## Four things that will bite you

**A nil value raises, loudly.** If you add the column without a default and existing rows get
`NULL`, Rails tells you exactly what is wrong:

```
For optimistic locking, locking_column ('lock_version') can't be nil.
Are you missing a default value or validation on 'lock_version'?
```

Good error message. Avoid it anyway with `default: 0, null: false`.

**`update_columns` and `update_all` skip the check entirely.** They bypass callbacks, validations
and the version comparison. Every place in your codebase reaching for those is a place where
optimistic locking is not in effect.

**`destroy` is protected too.** Deleting a record someone else has updated raises
`StaleObjectError`, which surprises people who assumed the check only applied to updates.

**`dup` clears the column on purpose.** A duplicated record starts fresh rather than inheriting a
version that belongs to a different row.

## What it does not do

Optimistic locking compares versions on a row that already exists. It has nothing to say about two
processes inserting at the same time.

If two background jobs both check "does a record for this event exist?" and both get no, they will
both insert. No amount of `lock_version` prevents that, because there is no row yet to hold a
version. That case needs a unique index and a rescue:

```ruby
add_index :events, :external_id, unique: true
```

```ruby
Event.create!(external_id: id)
rescue ActiveRecord::RecordNotUnique
  # already processed, treat as success
end
```

Row versioning handles concurrent updates. A unique constraint handles concurrent inserts. They
solve different problems and you often want both.

## Optimistic or pessimistic

The alternative is to take a real lock:

```ruby
Person.transaction do
  person = Person.lock.find(1)   # SELECT ... FOR UPDATE
  person.update!(first_name: "Michael")
end
```

Now other writers wait until you commit. Nothing gets lost, and nothing needs a retry.

`lock` is not something you write. It is a query method Rails ships in
`ActiveRecord::QueryMethods`, so it chains like `where` and works on any model whether or not a
`lock_version` column exists. The two features are independent, and using both on one model is
allowed:

```ruby
Person.lock.find(1)                             # SELECT ... FOR UPDATE
Person.lock("FOR UPDATE SKIP LOCKED").limit(10) # your own locking clause
person.lock!                                    # reload this row, locked
person.with_lock { person.update!(...) }        # transaction and lock in one call
```

The trap: a `FOR UPDATE` lock lives only as long as the transaction. Take one outside a transaction
and it is released immediately, so the code looks protected and is not. `with_lock` exists partly to
make that mistake harder.

Optimistic assumes conflicts are rare and detects them. Pessimistic assumes they are likely and
prevents them.

Pick optimistic when a human is editing a form and can be told "this changed, take another look."
Pick pessimistic for read-modify-write on rows that are genuinely contended, like a balance or an
inventory count, where a retry loop is worse than a short wait. Pessimistic locks cost you held
locks, deadlock risk if you take them in inconsistent orders, and the need for a `lock_timeout` so
one stuck transaction cannot take the application down with it.

## It has been there the whole time

I went looking for when this landed. The commit is from the last day of 2004:

```
Added automated optimistic locking if the field lock_version is present
#384 [Michael Koziarski]
```

That predates Rails 1.0. The design has not changed in twenty years: add the column, the feature
turns on.

Which makes it a strange thing to be obscure. My guess is that features you enable by writing code
get found by people reading code, and a feature you enable by adding a column does not appear
anywhere for anyone to notice.

If your app has forms where two people can plausibly edit the same record, it is one migration, one
hidden field, and one rescue.

## Sources

- [ActiveRecord::Locking::Optimistic](https://api.rubyonrails.org/classes/ActiveRecord/Locking/Optimistic.html)
- [ActiveRecord::Locking::Optimistic::ClassMethods](https://api.rubyonrails.org/classes/ActiveRecord/Locking/Optimistic/ClassMethods.html)
- [ActiveRecord::Locking::Pessimistic](https://api.rubyonrails.org/classes/ActiveRecord/Locking/Pessimistic.html)
- [Rails guides: locking records for update](https://guides.rubyonrails.org/active_record_querying.html#locking-records-for-update)
