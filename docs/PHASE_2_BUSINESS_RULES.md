# P_CEO_OS Phase 2 Business Rules

## Status and scope

- Status: implemented on `codex/phase-2-core-workflow`, pending CEO acceptance.
- Scope: Goals, Sprints, Tasks, Today, Ideas, deterministic Advisor and local Audit History.
- Persistence: browser LocalStorage adapter only. It is Phase 2 Local Mock data, not production data.
- Explicitly excluded: Supabase tables/Auth/RLS, migrations, OpenAI, production AI, CRM and external integrations.

## Core workflow

```text
Goal → Sprint → Task → Today → Review
Idea → Mock AI analysis → CEO confirmation → Task or remain Idea
```

Task count is not the success metric. Strategic result, Primary Outcome and Today's One Thing have higher weight.

## AI governance

```text
Read → Analyze → Suggest → Propose → Confirm → Execute → Audit
```

Phase 2 uses only deterministic rules marked `Mock AI` or `AI Suggestion Preview`. Suggestions never mutate Goal, Sprint, Task relationships, Today One Thing or Idea conversion without an explicit CEO action. No OpenAI Provider is constructed or called.

## Goals

- A Goal expresses Result + Why + Success Metrics + Time/Review.
- Required: title/result, why and at least one success metric.
- Deadline is optional, but `deadline` and `next_review_at` cannot both be absent.
- Goals support optional parent relations and optional many-to-many Company relations.
- Recommended hierarchy depth is at most 3. Deeper Goals may be saved but produce a warning.
- Statuses: Active, At Risk, Stalled, Completed, Paused and Abandoned.
- Progress model supports manual, metric, child-goal and milestone progress.
- Suggested progress is separate from official CEO progress; a gap may be displayed but never auto-applied.
- Four weeks without meaningful progress produces Goal Review attention. History is retained.

## Sprints

- A Sprint has one Primary Outcome and zero or more Secondary Outcomes.
- It may have zero or one Primary Goal and zero or more Secondary Goals.
- At most one Primary Sprint can be active. Activating another ends the previous active designation without deleting history.
- Multiple Maintenance Sprints are allowed; more than two active Maintenance Sprints produce Focus Risk.
- Recommended duration is 4–7 days. Shorter or longer periods warn but do not block saving.
- Expiry never auto-extends a Sprint. It enters Sprint Review.
- Review decisions: Complete, Extend, Carry Forward and Close Incomplete.
- Extend and Close Incomplete require a reason. Extend also requires a new end date.
- Carry Forward closes the current Sprint and creates a new Sprint with `carried_from_sprint_id`.

## Tasks

- Only title is required for fast capture; Goal, Sprint, Project, Company, Opportunity and Person relations are optional.
- Types: Strategic, Maintenance and Normal. Default is Normal.
- Statuses: Inbox, Todo, In Progress, Waiting, Blocked, Done and Cancelled.
- Waiting records who/what is awaited, last action and follow-up date. Due follow-ups enter Today Attention, not One Thing.
- Delegation records responsibility, assignee, deadline/follow-up and My Role. A delegated Task may also be Waiting.
- Blocked requires a blocker and can store a CEO-confirmed next action.
- Estimated minutes are optional. Actual time has future-compatible inferred/manual/focus source fields, but Phase 2 has no full timer.
- Hard Deadline and Target Date are distinct optional fields.
- Key Task mutations append local Audit Events rather than silently overwriting all history.

## Today

- Today is the CEO Daily Command Surface, not an unrestricted Todo List.
- There is at most one Today's One Thing. Mock AI can recommend it; CEO must confirm or choose manually.
- Today supports at most three Key Tasks and any number of visually secondary Other Tasks.
- Waiting follow-ups and strategic blockers appear in Attention.
- Unfinished work never automatically rolls into the next day. It enters Yesterday Follow-up for Continue, Reschedule, Return to Pool or Cancel decisions.
- Repeated Today assignment can produce a Planning Risk hint.
- The short CEO Brief answers One Thing, Attention, Strategic Signal and Decision Needed.

## Ideas

- Creation requires only `original_text`; source and timestamps are automatic.
- Saving never triggers analysis.
- The user explicitly requests `AI 分析` for a deterministic suggestion.
- Suggestions may keep or propose conversion. Phase 2 implements confirmed Task conversion.
- Conversion never deletes the original Idea. The Task stores `source_idea_id`, and the Idea stores the converted entity relation.
- Suggested organization and conversion are inert until CEO confirmation.
- The six-month reminder is deferred and is not part of V1 current scope.

## Strategic signals

- Basic Strategic Drift is deterministic, not ML.
- An active strategic Goal with no active supporting Sprint, no Strategic Task and 14 days without meaningful progress can warn about drift.
- Maintenance work materially crowding out Strategic work can produce the same signal.
- Four weeks without meaningful Goal progress produces Goal Review attention.

## Persistence and audit boundary

```text
React Island
  → Workflow Service
    → Domain Rules
    → Workflow Repository Contract
      → Phase 2 LocalStorage Adapter
      → Future Phase 3 Supabase Adapter
```

LocalStorage key: `p_ceo_os.phase2.workflow.v1`.

Local data is single-browser, unauthenticated and non-production. Clearing browser storage resets it. Repository contracts and entity shapes are designed so Phase 4 can replace the adapter without moving business rules into components.
