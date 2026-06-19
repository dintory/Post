# Dashboard redesign design

Date: 2026-06-14
Scope: `client/src/pages/Dashboard.tsx` first-screen redesign
Mode: design only, no code

## 1. brief pin

subject: ops dashboard for `Post`
audience: operator running many automated content channels
page job: scan live pipeline, catch failures, steer publish queue fast

Chosen direction: queue ledger + rail
Reason: best fit for operator cockpit. scan speed > decorative novelty.

## 2. design thesis

Dashboard ≠ analytics landing.
Dashboard = working desk.

First screen becomes single ops canvas:
- live pipeline ledger center
- compact KPI strip top
- right rail for failures, publish next, watchlist
- tabs demoted or removed from first-screen emphasis

Visual tone:
- editorial minimalism inside existing dark product shell
- flatter surfaces
- stronger type hierarchy
- fewer icons
- more dividers, labels, row rhythm
- no loud gradients, no glossy SaaS cards

## 3. tokens

Keep app dark base near current palette.
Refine within existing feel.

Color:
- canvas `#0A0A0A`
- surface-1 `#111111`
- surface-2 `#151515`
- line `rgba(255,255,255,0.08)`
- text-1 `#E8E8E8`
- text-2 `#909090`
- text-3 `#5F5F5F`
- success-soft `#1D3A2A`
- success-text `#8FB69A`
- warn-soft `#3A321D`
- warn-text `#C5AE74`
- danger-soft `#3A2020`
- danger-text `#C58D8D`

Type:
- display/ui: existing Geist stack okay in codebase
- data/meta: existing mono utility okay
- hierarchy via size/spacing/weight, not new font install

Shape:
- radius `10px`–`12px`
- borders 1px subtle
- shadows ⊥ or near-zero

## 4. layout

Desktop macro:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ title / scope / actions                                             │
│ KPI strip: running | blocked | due soon | published today           │
├───────────────────────────────────────────────┬──────────────────────┤
│ LIVE PIPELINE LEDGER                          │ FAILURES             │
│ in progress                                   │ publish next         │
│ queued                                        │ channel watchlist    │
│ blocked                                       │ automation health    │
│ ready to publish                              │                      │
└───────────────────────────────────────────────┴──────────────────────┘
```

Grid:
- main width 12-col mental model
- ledger 8 cols
- rail 4 cols
- gaps generous, likely `24px`
- vertical whitespace bigger than current dashboard

Mobile:
- single column
- order: header → KPI strip → failures → publish next → ledger → watchlist → health
- rows collapse; actions remain reachable

## 5. information architecture

### top bar
Contains:
- page title: `Operations`
- scope control: channel group / all channels
- time context: today / this week
- one primary action: create or run automation

Rule:
- top bar ! concise
- no crowded nav-like secondary controls

### KPI strip
4 compact cards, not hero stats.

Fields:
- running jobs
- blocked jobs
- due in next 2h
- published today

Card role:
- immediate state only
- tiny label, large number, small delta/note

### live pipeline ledger
Core surface.

Sections:
1. In progress
2. Queued
3. Blocked
4. Ready to publish

Each row:
- content/job title
- channel
- current stage
- ETA or scheduled time
- status token
- last event/meta
- primary row action

Example row actions:
- view
- retry
- approve
- publish now

Row style:
- list rhythm > card grid
- horizontal dividers
- compact but breathable
- strongest contrast on title + status

### right rail
#### failures needing attention
Small queue sorted by severity/time.
Each item shows:
- failed step
- affected asset/channel
- reason short text
- fix action

#### publish next
Upcoming scheduled items.
Shows:
- title
- channel
- scheduled time
- readiness state

#### channel watchlist
Only channels needing glance.
Shows:
- channel name
- anomaly/velocity note
- up/down signal

#### automation health
Short summary, not full chart.
Shows:
- success rate
- avg processing time
- retries last 24h

## 6. component changes

Keep existing data concepts where useful.
Reshape presentation.

Priority components:
- replace tab-led first-screen emphasis with ops canvas
- replace chunky stat cards with slimmer KPI band
- replace video-card-first sections with ledger rows
- reduce icon-first UI; icons support only
- keep modal/create flow out of first redesign unless needed for entry action

New/updated component set:
- `OperationsHeader`
- `KpiStrip`
- `PipelineLedger`
- `PipelineSection`
- `PipelineRow`
- `FailuresPanel`
- `PublishNextPanel`
- `WatchlistPanel`
- `HealthMiniPanel`

Can live inline in `Dashboard.tsx` first pass if needed.
Better split later if file grows.

## 7. motion

Motion quiet.
- fade/translate entry for major blocks
- tiny hover color shifts on rows/cards
- no dramatic counters or chart theatrics
- preserve reduced-motion behavior where possible

## 8. copy

Voice:
- plain
- operator-facing
- specific
- no hype

Examples:
- `Blocked jobs` not `Workflow bottlenecks`
- `Publish next` not `Upcoming launches`
- `Retry render` not `Resolve issue`

## 9. data mapping from current dashboard

Current data reusable:
- `topVideos` → watchlist/top channels summary
- `recentVideos` → ledger/publish-next seed rows
- current stat values → KPI strip

Current parts likely demoted/removed from first screen:
- tab-heavy overview shell
- generic chart-first emphasis
- thumbnail card grid as primary content

## 10. error/empty states

Failures panel empty:
- `No failures in last 24h`

Publish queue empty:
- `No scheduled publishes`

Ledger section empty:
- `No jobs in this stage`

Error copy:
- state issue
- name affected job if known
- give one next action

## 11. testing / validation

Design validation:
- first glance answers: what running? what blocked? what publishes next?
- page scans in ≤5s
- mobile order still useful
- no section feels decorative-only

Implementation validation:
- route renders without layout shift
- keyboard focus visible on row actions
- no overflow in ledger rows
- responsive at mobile / tablet / desktop
- existing dashboard interactions not broken unintentionally

## 12. risk

Main risk:
- redesign inside already-large `Dashboard.tsx` can turn messy fast

Mitigation:
- isolate ops sections into small local components or new files
- keep first pass to first-screen canvas only
- defer deep modal/video flow cleanup unless needed

## 13. out of scope

- auth/routes
- sidebar structure
- other pages
- full modal workflow rewrite
- backend/data model changes

## 14. build plan seed

1. remove first-screen tab emphasis
2. build top bar + KPI strip
3. build ledger sections + row schema
4. build right rail panels
5. map current mock data into new surfaces
6. tune spacing/type/color
7. responsive pass
8. validation
