---
layout: post
title: "From Turbo Streams to Turbo Morph: Simplifying Real-Time Rails"
date: 2026-03-19 09:00:00 -0500
last_modified_at: 2026-03-19 09:00:00 -0500
categories: [development]
tags: [rails, hotwire, turbo, morph, real-time]
---

## The Setup

I'm building a multitenant order management system for cafes and restaurants. Orders come in, the kitchen sees a live queue, waiters track item status — all updating in real time across multiple screens.

The natural first choice in Rails? **Turbo Streams** — targeted DOM updates over WebSocket. Replace this partial, append to that list, remove that element.

It worked. Until it didn't.

---

## I Almost Kept Targeted Broadcasts

On March 13, I made a deliberate decision to **keep** targeted Turbo Stream broadcasts. The infrastructure worked, the tests passed, and I'd already invested time building it. I documented the decision and moved on.

Six days later, I reversed it.

What changed? I started building the **kitchen queue** — a live view where cooks see incoming orders. The queue needed to stay in sync with the order page, the tables view, and the takeout view. Every item status change had to update all four screens simultaneously.

That's when the targeted approach fell apart. Not because of a single bug, but because the **coordination cost grew faster than the features**. Each new view multiplied the number of broadcast methods, target IDs, and partials I had to keep in sync.

The moment I caught myself writing the fifth broadcast method for a single status change, I knew the architecture was wrong.

---

## The Problem With Targeted Broadcasts

Here's what my `LineItem` model looked like with targeted Turbo Stream broadcasts:

```ruby
after_update_commit :broadcast_item_update, if: :saved_change_to_status?

private

def broadcast_item_update
  broadcast_replace_to "order_#{order_id}",
    target: "line_item_#{id}",
    partial: "line_items/line_item",
    locals: { item: self, order: order }

  broadcast_kitchen_update
  broadcast_spot_update
end

def broadcast_kitchen_update
  case status
  when "cooking"
    broadcast_append_to "store_#{order.store_id}_kitchen",
      target: "kitchen-queue",
      partial: "kitchen/line_item_card",
      locals: { item: self }
  when "ready"
    broadcast_replace_to "store_#{order.store_id}_kitchen",
      target: "kitchen_line_item_#{id}",
      partial: "kitchen/line_item_card",
      locals: { item: self }
  when "cancelled", "delivered"
    broadcast_remove_to "store_#{order.store_id}_kitchen",
      target: "kitchen_line_item_#{id}"
  end
end

def broadcast_spot_update
  broadcast_replace_to "store_#{order.store_id}_tables",
    target: "spot_#{order.spot_id}",
    partial: "tables/table",
    locals: { spot: order.spot, order: order }

  if order.spot.takeout?
    broadcast_replace_to "store_#{order.store_id}_takeouts",
      target: "takeout_order_#{order.id}",
      partial: "takeouts/order_card",
      locals: { order: order }
  end
end
```

That's **one model**. The `Order` model had a similar amount. In total, roughly **120 lines** of broadcast code across two models.

Every broadcast needed:

- The correct **channel name**
- The correct **DOM target ID**
- The correct **partial path**
- The correct **locals** with fresh data

And here's the real problem: **every new real-time feature multiplied the complexity**. Adding the kitchen queue meant adding broadcast methods for every status transition. Adding takeout support meant more targets, more partials, more conditionals.

---

## The Bugs

Targeted broadcasts introduced two categories of bugs that morph eliminates entirely.

### 1. Stale Data

When a callback fires, `self` may have fresh attributes — but **associations are still cached in memory**.

```ruby
# self.status is "ready" (correct)
# self.order.line_items still has the OLD status in memory
broadcast_replace_to "order_#{order_id}",
  partial: "orders/order_summary",
  locals: { order: order }
```

The order summary partial reads `order.line_items` to compute readiness. Since the association is stale, it renders with **outdated data**. The fix was manual `.reload` calls scattered across the code.

### 2. Double Broadcasts

When multiple models trigger broadcasts on the same commit, the same DOM target can get replaced twice in rapid succession, causing **visible flicker**.

---

## The Switch to Morph

Turbo 8 introduced **page refresh with morphing** via `turbo_refreshes_with method: :morph`. Instead of surgically replacing individual DOM elements, it tells every subscribed browser: "re-fetch this page and I'll morph the differences."

Here's the same `LineItem` after the migration:

```ruby
after_update_commit :broadcast_refreshes, if: :saved_change_to_status?

private

def broadcast_refreshes
  broadcast_refresh_to "order_#{order_id}"
  broadcast_refresh_to "store_#{order.store_id}_kitchen"
  broadcast_refresh_to "store_#{order.store_id}_tables"
  broadcast_refresh_to "store_#{order.store_id}_takeouts"
end
```

Four lines. No partials, no target IDs, no locals, no stale data.

---

## What Changed in the Views

Each page that subscribes to real-time updates needs two things:

1. A `turbo_stream_from` tag (same as before)
2. A morph declaration

```erb
<%= turbo_refreshes_with method: :morph, scroll: :preserve %>
<%= turbo_stream_from "store_#{Current.store.id}_kitchen" %>
```

The `scroll: :preserve` part is important. **Without it, every refresh scrolls the page to the top** — completely unusable for a kitchen queue that staff are actively watching during service. With it, Turbo preserves scroll position, focus, and form state across morphs.

---

## What Changed in the Controllers

Before, controllers had to handle both HTML and Turbo Stream responses:

```ruby
def ready
  @line_item.mark_ready!(by: Current.user)
  @order.reload
  respond_to do |format|
    format.turbo_stream
    format.html { redirect_to order_path(@order) }
  end
end
```

Each action had a matching `.turbo_stream.erb` template with its own set of `turbo_stream.replace` calls.

After:

```ruby
def ready
  @line_item.mark_ready!(by: Current.user)
  redirect_back fallback_location: order_path(@order),
    notice: t("kitchen.marked_ready")
end
```

Plain redirects. The model callbacks handle all real-time updates. I deleted **three Turbo Stream templates** and simplified every action method.

---

## What We Deleted

The migration removed:

| What | Lines |
|------|-------|
| Model broadcast methods | ~120 |
| Turbo Stream templates | ~30 |
| Stimulus controllers (audio/queue) | ~118 |
| **Total** | **~268** |

Three Stimulus controllers were deleted because they existed solely to coordinate DOM updates that morph now handles automatically — things like updating the queue count badge or toggling empty states.

---

## The Flow After Morph

Here's how the real-time update cycle works now:

```
1. Kitchen staff taps "Listo" on a cappuccino
   → PATCH /orders/:id/line_items/:id/ready

2. Controller: mark_ready! → redirect_back

3. Model callback fires broadcast_refreshes:
   → broadcast_refresh_to order_42
   → broadcast_refresh_to store_1_kitchen
   → broadcast_refresh_to store_1_tables
   → broadcast_refresh_to store_1_takeouts

4. Every subscribed browser re-fetches its page.
   Turbo morphs the DOM diff.

   /kitchen    → card moves from "cooking" to "ready"
   /orders/42  → item badge turns green
   /tables     → table status updates
   /takeouts   → order card updates

5. No flicker. Scroll preserved. Focus preserved.
```

No partial coordination. No target ID matching. The server always renders the truth.

One thing worth noting: `turbo_stream_from` uses signed stream names by default, so your tenant-scoped channels (like `store_#{id}_kitchen`) are safe from unauthorized subscriptions out of the box.

---

## Try It Yourself

Here's a minimal example you can drop into any Rails 8 app with Action Cable configured:

```ruby
# app/models/message.rb
class Message < ApplicationRecord
  after_create_commit -> { broadcast_refresh_to "messages" }
  after_update_commit -> { broadcast_refresh_to "messages" }
  after_destroy_commit -> { broadcast_refresh_to "messages" }
end
```

```erb
<%# app/views/messages/index.html.erb %>
<%= turbo_refreshes_with method: :morph, scroll: :preserve %>
<%= turbo_stream_from "messages" %>

<h1>Messages</h1>

<% @messages.each do |message| %>
  <div id="<%= dom_id(message) %>">
    <p><%= message.body %></p>
    <small><%= time_ago_in_words(message.created_at) %> ago</small>
  </div>
<% end %>
```

Open two browser tabs. Create a message in one — the other updates instantly. No JavaScript, no stream templates, no target IDs. That's the entire real-time layer.

---

## The Tradeoff

Morph re-renders the **entire page** on the server for every broadcast, instead of rendering a single partial. At scale, this matters.

At cafe/restaurant scale? It's negligible. A kitchen queue page with 15 items is trivial to re-render.

The other tradeoff: **no more client-side reactions to specific events**. With targeted streams, you could play a sound when an item was appended to the kitchen queue. With morph, you just get a re-rendered page — there's no "this specific thing changed" signal.

For audio notifications, I'll need a different approach — likely a small Stimulus controller listening to a dedicated Action Cable channel. Action Cable custom channels handle this cleanly.

---

## When to Use Which

This experience gave me a clearer mental model:

**Use Turbo Morph when:**
- Multiple views need to stay in sync
- The data being displayed has complex interdependencies
- You want real-time updates without managing DOM coordination
- Your pages are lightweight enough to re-render

**Use Targeted Turbo Streams when:**
- You need to react to specific events on the client (animations, sounds)
- Re-rendering the full page is genuinely expensive
- You have a single, well-defined target that changes in isolation

---

## Final Thoughts

The most surprising part of this migration was how much **incidental complexity** the targeted approach had introduced. Code that felt necessary — all those broadcast methods, stream templates, Stimulus controllers — turned out to be scaffolding around a coordination problem that morph solves at a lower level.

I documented a decision to keep targeted broadcasts, then reversed it six days later. That's not a failure — that's the system working. The decision document forced me to articulate *why* I was keeping the old approach, which made it obvious when the reasons no longer held.

Sometimes the right move is to stop trying to be precise and let the framework do the work.
