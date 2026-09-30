# Take-Home Assignment — The Untested API

**Candidate:** Rutvik  
**Date:** September 30, 2026  
**Stack:** Node.js, Express, Jest, Supertest  

---

## Overview

This repository contains the completed 2-day take-home assignment for the Task Manager API. Over the course of the assessment:

1. **Test Suite Created:** Built unit tests (`taskService.test.js`) and integration tests (`tasks.routes.test.js`) covering happy paths, input validation, and edge cases.
2. **Bugs Discovered & Fixed:** Identified 3 bugs through failing test assertions on Day 1, and resolved all 3 bugs on Day 2.
3. **New Feature Added:** Implemented the `PATCH /tasks/:id/assign` endpoint with input validation, reassignment support, and full test coverage.
4. **Final Metrics:** 48 passing tests (0 failures) and **93.61% line coverage** (well above the 80% requirement).

---


## Getting Started

### 1. Setup

```bash
cd task-api
npm install
```

### 2. Running Tests & Coverage

```bash
# Run test suite (48 tests)
npm test

# Run tests with full coverage report
npm run coverage
```

### 3. Running the Server

```bash
npm start
# Server runs on http://localhost:3000
```

> **Note:** The API uses an in-memory data store (`let tasks = []`). State resets every time the server restarts.

---

## Test Results & Coverage

```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |   94.19 |    84.88 |   93.33 |   93.61 |                   
 src             |   69.23 |       75 |       0 |   69.23 |                   
  app.js         |   69.23 |       75 |       0 |   69.23 | 10-11,17-18       
 src/routes      |     100 |    91.66 |     100 |     100 |                   
  tasks.js       |     100 |    91.66 |     100 |     100 | 20-21             
 src/services    |     100 |    94.73 |     100 |     100 |                   
  taskService.js |     100 |    94.73 |     100 |     100 | 22                
 src/utils       |   81.48 |    76.92 |     100 |   81.48 |                   
  validators.js  |   81.48 |    76.92 |     100 |   81.48 | 12,15,25,28,31    
-----------------|---------|----------|---------|---------|-------------------

Test Suites: 2 passed, 2 total
Tests:       48 passed, 48 total
Snapshots:   0 total
Time:        ~2.8 s
```

---

## Summary of Bugs Found & Resolved

| Bug | Location | Issue | Fix Applied |
| :--- | :--- | :--- | :--- |
| **Bug 1: Status Filter Substring Match** | `taskService.js:9` | Used `.includes()` instead of strict equality. Searching for `"do"` returned both `"todo"` and `"done"` tasks. | Updated to `t.status === status`. |
| **Bug 2: Pagination Off-By-One** *(Primary Day 2 Fix)* | `taskService.js:12` | Calculated offset as `page * limit`. Because query pages are 1-based, page 1 skipped items 0–9. | Updated to `(page - 1) * limit`. |
| **Bug 3: Priority Overwrite on Complete** | `taskService.js:69` | Hardcoded `priority: 'medium'` upon completing a task, resetting high-priority tasks. | Removed `priority: 'medium'` to preserve existing priority. |

---

## New Feature: `PATCH /tasks/:id/assign`

Assigns a task to a user by updating the `assignee` field on the task.

### Endpoint Details
- **Method:** `PATCH`
- **Path:** `/tasks/:id/assign`
- **Body:** `{ "assignee": "string" }`

### Design Decisions
- **Empty / Whitespace Validation:** `validators.js` checks that `assignee` is provided and is a non-empty string after trimming. Blank strings return `HTTP 400 Bad Request`.
- **Reassignment:** If a task already has an assignee, passing a new assignee overwrites the field directly (matching Jira and GitHub workflows).
- **Task Not Found:** Returns `HTTP 404 Not Found` if the task ID does not exist.

### Sample Request & Response
```bash
curl -X PATCH http://localhost:3000/tasks/<id>/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee": "Alice"}'
```

```json
{
  "id": "c1f7a83d-3b8c-4a34-bb64-c2c366472421",
  "title": "Setup CI pipeline",
  "description": "",
  "status": "todo",
  "priority": "medium",
  "dueDate": null,
  "completedAt": null,
  "createdAt": "2026-09-30T07:12:00.000Z",
  "assignee": "Alice"
}
```

---

## API Reference

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | List tasks. Supports `?status=`, `?page=`, `?limit=` |
| `GET` | `/tasks/stats` | Counts by status + overdue count |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/:id` | Update task fields |
| `DELETE` | `/tasks/:id` | Delete a task (204 No Content) |
| `PATCH` | `/tasks/:id/complete` | Mark task as done (sets `completedAt`) |
| `PATCH` | `/tasks/:id/assign` | **Assign/reassign a task to a user** |

### Task Schema
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 string | null",
  "completedAt": "ISO 8601 string | null",
  "createdAt": "ISO 8601 string",
  "assignee": "string (optional)"
}
```

*(Note: Earlier documentation referenced `pending`, but the codebase validators strictly require `todo`, `in_progress`, or `done`).*

---

## Submission Reflection Notes

### 1. What I would test next with more time:
- **Concurrency & Race Conditions:** Because tasks are stored in an in-memory array (`tasks = []`), simultaneous asynchronous requests modifying or splicing the same index could cause race conditions. I would add concurrency tests simulating parallel updates.
- **Timezone Edge Cases:** Testing `dueDate` across different UTC offsets and daylight savings transitions to verify overdue counts in `getStats` stay accurate.
- **Payload Fuzzing:** Testing very large strings, special characters, and malformed JSON payloads.

### 2. Anything that surprised me in the codebase:
- **Status Enum Discrepancy:** The initial README documented status values as `pending | in-progress | completed`, but the actual validator strictly enforced `["todo", "in_progress", "done"]`. Checking the validator source code was key to writing accurate tests.
- **Priority Mutation:** `completeTask` had `priority: 'medium'` hardcoded, which silently mutated existing task priorities.

### 3. Questions I would ask before shipping to production:
- **Persistence:** What database (PostgreSQL, MongoDB) should we connect to replace the in-memory array so state persists across restarts and container instances?
- **Authentication & RBAC:** Who is authorized to assign, modify, or delete tasks? Should `assignee` validate against a Users service instead of arbitrary strings?
- **Soft Deletion:** Does compliance or user recovery require soft deletes (`deletedAt` timestamp) rather than permanently splicing tasks from memory?
