# Costco Tracker Analytics Roadmap

## Purpose

This document turns the current product analysis and external user research into an execution plan for the next phase of Costco Tracker.

The goal is not to expand the app into a general shopping platform. The goal is to make the existing receipt-driven experience meaningfully smarter through:

- stronger personal analytics
- better visual storytelling
- faster understanding of shopping patterns
- deeper insight into repeat Costco behavior

This roadmap is intentionally shaped around the current project constraints:

- local-first
- no new backend
- no dependency on external warehouse inventory APIs
- no product category system as a core requirement
- no price alert system as a core requirement

## Product Direction

### What we are optimizing for

Costco Tracker should answer questions like:

- What do I actually buy again and again at Costco?
- Which products are true staples versus occasional buys?
- How does my personal price history change over time?
- How do my shopping trips differ from one another?
- Which warehouse do I use for which behavior?
- What patterns show up across seasons, months, and repeat cycles?

### What we are explicitly not prioritizing

These ideas may be valid in other products, but they are not the focus of this roadmap:

- price drop alerts
- large taxonomy or category management
- social features
- crowdsourced warehouse data
- new-item discovery feeds
- heavy warehouse inventory integrations

## Inputs Behind This Plan

This roadmap is based on two inputs:

1. Current codebase analysis
2. Reddit research around Costco user pain points and wishlist behavior

### Key signals from Reddit

The strongest repeated user requests were:

- searchable purchase history
- better receipt detail and less confusing grouped line items
- better understanding of total spending over time
- stronger planning around repeat staples and sale cycles
- warehouse-specific shopping behavior

Relevant threads:

- [How to search purchase history?](https://www.reddit.com/r/Costco/comments/15pg1zd)
- [Dear Costco, Please Make Purchase History Searchable](https://www.reddit.com/r/Costco/comments/1mlwjx1)
- [Online Receipt Issues - Product grouping](https://www.reddit.com/r/Costco/comments/17yj2wc)
- [Is there a way to track how much I’ve spent YTD at Costco?](https://www.reddit.com/r/Costco/comments/12n2blu)
- [What's the best way to keep track of new stuff at your warehouse?](https://www.reddit.com/r/Costco/comments/1e9qguc)
- [Using the Costco app for pricing](https://www.reddit.com/r/Costco/comments/1gux88h)
- [What are your staple (food) groceries from Costco?](https://www.reddit.com/r/Costco/comments/1k4uw37)
- [What are your go to Costco items that you only buy on sale and try to stock till the next sale?](https://www.reddit.com/r/Costco/comments/1lfh3j0/what_are_your_go_to_costco_items_that_you_only/)

## Strategic Principles

Every iteration in this roadmap should respect these principles:

1. Keep analytics personal, not generic.
2. Derive insight from receipt history the user already owns.
3. Favor visual clarity over dashboard density.
4. Prefer patterns and behaviors over raw tables.
5. Make each new analysis explainable in plain language.
6. Keep the app fast on local data and older devices.

## Success Criteria

This roadmap is successful if a user can quickly discover:

- their repeat Costco staples
- their most meaningful price history patterns
- how their trip behavior changes over time
- which warehouse they rely on most
- what changed in their Costco habits this year versus last year

## Delivery Strategy

The work is split into five reasonable iterations. Each iteration delivers a user-visible upgrade and also builds the foundation for the next one.

The order matters:

- Iteration 1 improves discoverability and baseline analytics
- Iteration 2 introduces repeat-purchase intelligence
- Iteration 3 adds richer visual storytelling
- Iteration 4 adds trip-level and warehouse behavior analysis
- Iteration 5 refines the experience and makes the analytics feel cohesive

---

## Iteration 1: Searchability And Baseline Insight

### Goal

Make the existing receipt and product data much easier to explore before adding more advanced analytics.

### Why this comes first

The strongest repeated pain point in user discussions is simple: people want to find things in their history fast. If the user cannot reliably answer "have I bought this before?" then deeper analytics will feel secondary.

### Scope

- Add cross-history search across receipts and products
- Improve product detail discovery from search results
- Add stronger baseline summary analytics
- Improve empty states so the user understands what the app can reveal after import

### Features

#### 1. Unified purchase history search

Search by:

- item number
- product description
- warehouse name
- receipt barcode

Expected outcomes:

- user can jump directly to a product or receipt
- user no longer has to scroll through grouped receipt timelines

#### 2. Expanded baseline analytics on Dashboard

Add cards or compact sections for:

- year-to-date spend
- average receipt size
- total trips
- total unique items purchased
- busiest shopping month

#### 3. Stronger Analysis page controls

Add:

- better sort labels
- search results highlighting
- toggle between "most bought", "most spent", and "recently bought"

### Technical work

- introduce a shared normalized search index over local receipt/product data
- extract summary calculations into pure utilities
- reduce duplicated in-memory filtering logic where possible

### Definition of done

- user can search across purchase history from one place
- dashboard gives a stronger "how much / how often / when" overview
- product discovery feels immediate, not hidden behind browsing

### Risk

Low. Mostly UX and data shaping work on top of existing structures.

---

## Iteration 2: Staples And Repeat-Purchase Intelligence

### Goal

Turn purchase history into behavioral insight by identifying repeat Costco patterns.

### Why this matters

Reddit discussions around Costco staples, essentials, and "always buy" items are a major signal. Costco users think in recurring household patterns more than in one-off purchases.

### Scope

- identify repeat staples
- calculate repurchase cadence
- show persistence and drop-off in buying habits

### Features

#### 1. Staples analytics

Create a section or page for:

- most consistent repeat buys
- longest-running staples
- products bought in the most distinct months
- products with the highest purchase regularity

Suggested labels:

- Core Staples
- Frequent Refills
- Seasonal Staples
- Faded Staples

#### 2. Repurchase cadence

For each product, compute:

- average days between purchases
- shortest gap
- longest gap
- last seen date

Use this to create insights such as:

- "Usually rebought every 21 days"
- "You used to buy this monthly, but not recently"

#### 3. Habit change detection

Highlight:

- products bought regularly last year but not this year
- new staples emerging this year
- items with increasing or decreasing frequency

### Visualizations

- sparkline or mini timeline for repeat activity by month
- cadence chip on product detail
- repeat-frequency matrix by month

### Technical work

- create pure utilities for repeat interval calculations
- define thresholds for "staple", "seasonal", "faded", and "emerging"
- add tests for repeat-purchase heuristics

### Definition of done

- user can clearly see which items are true staples
- product detail pages explain repeat cadence in one glance
- the app can surface changes in buying habit over time

### Risk

Medium. The hard part is choosing heuristics that feel intuitive and not arbitrary.

---

## Iteration 3: Better Visual Storytelling

### Goal

Upgrade the app from "useful stats" to "insightful visual narrative".

### Why this matters

The project already has useful data. The next level is not more numbers but better visual explanation. This is where the app can start feeling memorable.

### Scope

- improve chart variety
- make trend views easier to compare
- introduce visuals that reveal patterns at a glance

### Features

#### 1. Shopping calendar heatmap

Show:

- days with shopping activity
- total spend intensity
- optional mode for trip count instead of spend

Questions it answers:

- When do I usually shop?
- Which months are heavy Costco months?
- Are my shopping patterns clustered around pay cycles or weekends?

#### 2. Product price history upgrade

Improve product detail price visualization with:

- latest price marker
- personal average price line
- lowest observed price marker
- quantity-aware context where useful

#### 3. Monthly behavior comparison

Enhance trends view with:

- side-by-side month comparisons
- rolling average smoothing
- visual callouts for biggest jumps or drops

#### 4. Purchase frequency scatter plot

Map products on axes like:

- frequency vs total spend
- frequency vs price volatility

This helps separate:

- cheap staples
- expensive repeat buys
- occasional splurges
- low-frequency high-cost items

### Visual direction

Focus on clarity, not chart novelty. The visual system should feel:

- compact
- information-rich
- easy to scan on desktop and mobile

### Technical work

- centralize chart-ready data transformations
- establish reusable chart component patterns
- add storybook-like local fixture views if needed for fast visual iteration

### Definition of done

- trends page communicates patterns visually, not just numerically
- product detail pages feel substantially more informative
- at least one new visualization immediately reveals behavior not obvious from current cards

### Risk

Medium. The main risk is overbuilding visuals that look impressive but answer weak questions.

---

## Iteration 4: Trip Behavior And Warehouse Intelligence

### Goal

Move from product-only insight to trip-level understanding.

### Why this matters

Costco behavior is often trip-shaped, not item-shaped. Users think in terms like:

- quick refill run
- big stock-up trip
- gas-only stop
- holiday haul

Warehouse differences matter too, especially when people split behavior across locations.

### Scope

- classify trip patterns
- compare warehouses
- explain shopping behavior at trip level

### Features

#### 1. Trip archetypes

Detect lightweight trip types using receipt data:

- Quick Refill
- Big Haul
- Gas Stop
- Bulk Stock-Up
- Single-Purpose Run

The point is not rigid classification. The point is readable personal patterns.

#### 2. Basket composition analysis

For trips, show:

- average items per trip
- average spend per trip
- largest baskets
- smallest baskets
- trips with unusually high quantity concentration

#### 3. Often-bought-together analysis

At product level, surface:

- products that frequently appear on the same receipt
- common refill bundles

Examples:

- eggs + milk + berries
- paper goods + detergent

#### 4. Warehouse analytics

Show:

- spend by warehouse
- trips by warehouse
- average basket size by warehouse
- gas behavior by warehouse
- product overlap by warehouse

### Visualizations

- warehouse comparison bars
- basket size distribution chart
- co-purchase network-lite list or ranked pair table
- trip archetype share chart

### Technical work

- define trip feature extraction utilities
- compute co-purchase pairs efficiently on local data
- avoid expensive full recomputation on every render

### Definition of done

- user can understand how their Costco trips differ from each other
- warehouse patterns become obvious
- the app surfaces product relationships beyond single-item history

### Risk

Medium to high. Co-purchase analysis and trip clustering can become noisy if not simplified carefully.

---

## Iteration 5: Cohesion, Polish, And Insight Packaging

### Goal

Make the analytics feel like one coherent product instead of a set of separate pages.

### Why this matters

By this point the app can have strong raw insight, but the final perceived quality will depend on how well the experience guides users through those insights.

### Scope

- improve navigation between insights
- add summary narratives
- package advanced analytics into digestible sections

### Features

#### 1. Insight summaries

Generate short narrative summaries such as:

- "Your Costco spending is concentrated in 3 heavy months"
- "You have 8 true staples bought across at least 9 months"
- "Warehouse A is your highest-spend location, but Warehouse B is where gas is cheaper in your history"

These should be deterministic summaries derived from local data, not LLM output.

#### 2. Year in review / period review

Create a shareable in-app summary page for:

- top staples
- biggest price moves
- busiest month
- most expensive trip
- favorite warehouse

This can also double as a retention feature.

#### 3. Cross-linking analytics

From any insight, users should be able to jump to:

- matching product detail
- related receipts
- warehouse-specific views

#### 4. UX polish pass

Focus on:

- mobile readability
- chart legends
- labels and explanatory copy
- loading and empty states
- perceived speed on larger local datasets

### Technical work

- unify analytics modules into a shared derived-data layer
- reduce repeated computations across pages
- add regression tests for all major analytical outputs

### Definition of done

- insights feel connected across the app
- the app can explain itself without extra documentation
- the analytics experience feels polished enough to call "v1 analytics"

### Risk

Low to medium. Mostly integration, simplification, and quality work.

---

## Suggested Release Rhythm

This is a practical cadence for implementation:

### Phase 1

- Iteration 1
- Iteration 2

Outcome:

- the app becomes much better at understanding repeat purchase behavior

### Phase 2

- Iteration 3

Outcome:

- the app becomes visually compelling and easier to interpret quickly

### Phase 3

- Iteration 4
- Iteration 5

Outcome:

- the app evolves from receipt tracker into a true Costco behavior analyzer

## Prioritization Matrix

### Must have

- unified history search
- year-to-date and baseline spend metrics
- staple detection
- repurchase cadence
- stronger product price history
- improved trends visualization

### Should have

- shopping calendar heatmap
- habit change detection
- warehouse analytics
- basket behavior analysis

### Nice to have

- often-bought-together analysis
- trip archetypes
- year in review page
- narrative insight summaries

## Execution Notes For Implementation

### Data model recommendations

Before or during Iteration 2, consider introducing a derived analytics layer that can provide:

- precomputed product aggregates
- precomputed repeat intervals
- monthly rollups
- warehouse rollups
- trip feature summaries

This does not require a backend. It can still be local-first and browser-based.

### Testing recommendations

The project already has a good testing base. Expand it in this order:

1. pure analytics utility tests
2. repeat cadence edge cases
3. co-purchase calculations
4. visualization data-shaping tests

### Performance recommendations

Current analytics are heavily computed from full receipt arrays in hooks. As the app grows, that may become the main constraint. This roadmap should gradually shift heavy logic toward:

- shared pure calculation utilities
- memoized derived datasets
- optional cached rollups in IndexedDB if needed later

## Recommended First Build Order

If only one immediate workstream starts now, build in this order:

1. Unified search
2. Dashboard baseline metrics
3. Staples detection
4. Repurchase cadence on product detail
5. Calendar heatmap
6. Improved trends comparisons

This sequence will create visible product value early without requiring major architectural churn upfront.

## Final Recommendation

The strongest version of Costco Tracker is not "more Costco features."

It is:

- a better memory of your Costco life
- a clearer explanation of your shopping habits
- a sharper visual layer over personal purchase history

If this roadmap is followed well, the app can become meaningfully better than Costco's own history experience while staying focused, private, and local-first.
