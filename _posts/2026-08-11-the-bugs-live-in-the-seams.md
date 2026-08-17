---
layout: post
title: "The Bugs Live in the Seams"
date: 2026-08-11 07:00:00 -0600
last_modified_at: 2026-08-11 07:00:00 -0600
categories: [development]
tags: [rails, ruby, testing, capybara, hotwire, may-store-journey]
---

My order management app had 187 passing tests. Green suite, clean Rubocop, zero Brakeman warnings. I added system tests and immediately found six bugs.

None of them were logic bugs. Every single one lived in a **seam**: a place where two pieces of code had to agree about something, and nothing in the codebase checked that they did.

That pattern turned out to be the interesting part, more than any individual fix.

---

## What a Seam Looks Like

Here is the worst bug of the six.

The login page renders flash messages through a component from a UI gem:

```erb
<%= render "components/toaster", position: :bottom_right do %>
  <%= toast_flash_messages %>
<% end %>
```

Looks fine. It is not. The component's signature is:

```erb
<%# locals: (position: :bottom_right, content: nil, css_classes: "", **html_options) %>
...
<%= content if content %>
```

It takes a `content:` local. It never yields. So the block I passed was **silently discarded**, and every flash message on the login page disappeared. Type your password wrong and the page just quietly reloads. No error, no explanation, nothing.

That shipped. Users would have hit it on day one.

Note what kind of bug this is. Both sides are individually correct. My layout is valid ERB. The component works exactly as documented. The bug is entirely in the **agreement between them**, and Ruby has nothing to say about it: passing a block to something that ignores blocks is not an error.

The tell is that the same app got it right elsewhere. The application layout reads:

```erb
<%= render "components/toaster", position: :bottom_left,
      content: toast_flash_messages %>
```

Same component, correct call. Two layouts, two conventions, one of them wrong for who knows how long.

---

## The Same Shape, Five More Times

Once I noticed the pattern, the other bugs sorted themselves into it.

**Two code paths that must mirror each other.** Adding a line item removes the "no items" message:

```erb
<%= turbo_stream.remove "no_items_message" %>
```

Removing the last line item never put it back. Add and remove are written months apart, in different files, and nothing enforces that they stay symmetrical. Delete your only item and the list goes blank with no explanation until you reload.

**The app layer disagreeing with the database.** The admin controller deleted a record:

```ruby
def destroy
  @spot.destroy
  redirect_to admin_spots_path, notice: t("admin.spots.deleted")
end
```

There is a foreign key on `orders.spot_id`. Delete a table that has ever been used and Postgres raises `ActiveRecord::InvalidForeignKey`, which nothing catches, which is a 500 page. The schema knew the rule. The controller did not.

**A file disagreeing with itself.** The Spanish locale declared `admin:` twice at the top level. YAML keeps the last one, so eight keys silently evaluated to `nil`. No error, no warning, just a block of translations that was never going to load.

**A model disagreeing with its translations.** A missing attribute translation meant an underpaid bill showed a Spanish speaker:

```
Received cents debe ser mayor o igual a $45.00
```

Half English, half Spanish, in an app whose entire premise is Spanish-first.

Six bugs. Zero of them a wrong calculation. All of them two things failing to agree.

---

## Why Unit Tests Structurally Cannot See These

This is the part I find genuinely useful, and it is not "write more tests."

A unit test **instantiates one side of the seam and asserts about it**. That is what makes it fast and focused, and it is exactly why it cannot see this class of bug.

My model tests were correct and thorough. `Payment` really does reject insufficient amounts. `Spot` really does validate its name. Every one of those tests passed while the login page ate its error messages, because no model test renders a layout.

My controller tests were also correct. They asserted status codes and redirects. They passed while the bill page 500'd, because no controller test in the suite deleted a spot that had orders.

The bug is never inside a unit. It is in the space between units, and by construction that space is what a unit test excludes.

You can test seams without a browser. Two of my six were caught more precisely at the request level than they ever could have been in Capybara. But somebody has to actually exercise the assembled thing, and that is the job system tests do that nothing else does.

---

## The Counter-Lesson: Browsers Are Not Free

Here is where I nearly made things worse.

Having found the login flash bug, I wrote the obvious system test:

```ruby
click_on I18n.t("login.submit")
assert_text I18n.t("login.error")
```

It passed. Then it failed. Then it passed again.

The flash renders in a toast that auto-dismisses after five seconds. Run that test alone and five seconds is an eternity. Run it under eleven parallel processes on a loaded machine and the toast can be gone before the assertion looks for it. I did not reason this out in advance, I watched it fail in a full-suite run after passing in isolation.

A flaky test is worse than no test. It trains you to re-run instead of investigate, and the day it catches something real you will shrug and hit retry.

So I moved the assertion down a level:

```ruby
test "a failed login renders the error message" do
  post login_url(subdomain: @store.subdomain),
    params: { employee_number: "EMP-001", password: "wrong" }

  assert_response :unprocessable_entity
  assert_includes response.body, I18n.t("login.error")
end
```

No browser, no timers, no five-second window. Milliseconds, and deterministic.

And notice: this asserts the actual defect **more precisely** than the browser test did. The bug was that a string was missing from server-rendered HTML. This checks that the string is in the server-rendered HTML. The Capybara version was testing that, plus Turbo, plus Stimulus, plus CSS, plus a timer, and any of those could fail it for reasons that have nothing to do with the bug.

The system test kept the part that genuinely needs a browser:

```ruby
test "wrong password leaves the user on the login page" do
  # ...
  assert_current_path login_path
  assert_selector "input[name='employee_number']"
end
```

---

## The Rule I Landed On

**Test at the lowest level that can actually catch the bug.**

Not the lowest level you can write a test at. The lowest level that can *fail* when the bug is present.

For my six:

| Bug | Lowest level that catches it |
|---|---|
| Flash swallowed by component | Integration. It is missing HTML in a response body. |
| Missing "no items" after delete | System. A Turbo Stream has to actually execute. |
| Deleting a referenced spot 500s | Model. `destroy` should return `false`, not raise. |
| Deleting a referenced payment method | Model. Same. |
| Duplicate YAML key | None of them. No test level catches a key that quietly overwrites another. This one wants a linter. |
| Untranslated attribute | Model or integration. Assert the English string never appears. |

Only one of six genuinely required a browser. But I would not have found *any* of them without writing the browser tests, because that was the exercise that made me walk through the app as a user instead of as an object graph.

That is the resolution of the apparent contradiction. **System tests are extraordinarily good at finding bugs and frequently the wrong place to keep the regression test.** Use the browser to discover, then write the guard at the level that owns the defect.

---

## Put the Rule Where It Belongs

The two 500s deserve a closing note, because my first fix was wrong.

I started here:

```ruby
def destroy
  @spot.destroy
  redirect_to admin_spots_path, notice: t("admin.spots.deleted")
rescue ActiveRecord::InvalidForeignKey
  redirect_to admin_spots_path, alert: t("admin.spots.in_use")
end
```

It works. It is also the rule in the wrong place. "A spot with orders cannot be deleted" is a fact about spots, not about one controller action. Written that way, it holds only where somebody remembered to rescue, and it is invisible in the console, in a background job, or in the next controller that deletes a spot.

Rails already has the right tool:

```ruby
class Spot < ApplicationRecord
  has_many :orders, dependent: :restrict_with_error
end
```

Now `destroy` returns `false` and puts a translated message on `record.errors`, everywhere, and the controller goes back to being boring:

```ruby
def destroy
  if @spot.destroy
    redirect_to admin_spots_path, notice: t("admin.spots.deleted")
  else
    redirect_to admin_spots_path, alert: @spot.errors.full_messages.to_sentence
  end
end
```

Which also drops the regression test from a browser test to a model test that runs in a millisecond. Moving the rule to the right layer moved the test to the right layer for free. That happens a lot, and it is a decent smell test: if a rule can only be tested through a browser, it may be living too far from the thing it is a rule about.

---

## My Fix Had a Seam In It

Here is how it ended, which is the best evidence for the argument.

Code review caught that my fix was half a fix.

`dependent: :restrict_with_error` is **per association**. I guarded `payments`. But the schema has two foreign keys pointing at `payment_methods`:

```ruby
add_foreign_key "payments", "payment_methods"
add_foreign_key "cash_closing_lines", "payment_methods"
```

There was no `cash_closing_lines` association on the model at all. So a payment method with zero payments but one cash closing line sailed straight past my guard and raised `InvalidForeignKey` exactly as before. One of my own fixtures was in precisely that state, and my new tests missed it because they happened to exercise the two payment methods where the guard did fire.

A fix for a seam bug, with a seam in it. The model still held an incomplete picture of the schema.

The interesting part is what fixes that permanently, and it is not "remember to add the association." It is asking the database directly:

```ruby
def unguarded_foreign_keys_for(model)
  connection = ActiveRecord::Base.connection

  inbound = connection.tables.flat_map do |table|
    connection.foreign_keys(table)
      .select { |fk| fk.to_table == model.table_name }
      .map(&:from_table)
  end.uniq

  guarded = model.reflect_on_all_associations(:has_many)
    .select { |association| association.options[:dependent] == :restrict_with_error }
    .map { |association| association.klass.table_name }

  inbound - guarded
end
```

Add a foreign key to `payment_methods` next year and forget the association, and the suite fails with the offending table name in the message.

That is a test that checks the two sides of a seam **agree**, rather than testing either side. It is the general move, whenever you can find it: not more tests on each side, a test on the agreement.

---

## Takeaway

If you have a green suite and no system tests, you do not have evidence your app works. You have evidence that each piece works when asked about in isolation, which is a different and much weaker claim.

Write the browser tests. Expect them to find things. Then be disciplined about **where the regression test ends up**, because the browser is where bugs surface, not usually where they should be pinned down.

Six bugs, one afternoon, and not one of them was a bad calculation. Seven, if you count the one hiding in my fix.
