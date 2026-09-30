# Bug Report

During Day 1 testing of the Task Manager API, three distinct bugs were uncovered across the service and routing layers.

---

### Bug 1: Status Filter Uses Substring Matching Instead of Exact Match

- **File:** `src/services/taskService.js` (Line 9)
- **What happens:** The `getByStatus` function uses `tasks.filter((t) => t.status.includes(status))`. Because it uses `.includes()`, searching for a partial string like `"do"` returns both `"todo"` and `"done"` tasks.
- **Expected behavior:** Status filtering should perform an exact match (`t.status === status`). Querying with `"do"` should return no tasks since `"do"` is not a valid status enum.
- **How it was discovered:** Discovered via unit test `getByStatus -> should not match partial status strings` and route test `GET /tasks with status filter -> should not match partial strings`.
- **Recommended fix:**
  ```javascript
  const getByStatus = (status) => tasks.filter((t) => t.status === status);
  ```

---

### Bug 2: Off-By-One Error in Pagination Calculation

- **File:** `src/services/taskService.js` (Line 12)
- **What happens:** The offset is calculated as `const offset = page * limit;`. Query parameters use 1-based indexing (`page=1`). With `page=1` and `limit=10`, the offset evaluates to `10`, which skips items 0 through 9 and returns items starting from index 10.
- **Expected behavior:** Requesting `page=1` with `limit=10` should return the first 10 items (indexes 0 to 9).
- **How it was discovered:** Discovered when testing `getPaginated(1, 10)` on a dataset of 15 tasks. Instead of returning the first 10 tasks, it returned only 5 (tasks 11 to 15).
- **Recommended fix:**
  ```javascript
  const getPaginated = (page, limit) => {
    const offset = (page - 1) * limit;
    return tasks.slice(offset, offset + limit);
  };
  ```

---

### Bug 3: Completing a Task Silently Resets Its Priority

- **File:** `src/services/taskService.js` (Line 69)
- **What happens:** The `completeTask` function contains a hardcoded `priority: 'medium'` property in its update object. If a task was created with `"high"` priority, marking it complete unexpectedly downgrades its priority to `"medium"`.
- **Expected behavior:** Completing a task should set `status: 'done'` and record `completedAt`, leaving the existing `priority` unchanged.
- **How it was discovered:** Discovered via test `completeTask -> should not change the priority`, where a high-priority task was marked complete and the returned priority was checked.
- **Recommended fix:**
  Remove `priority: 'medium'` from the updated object in `completeTask`.

---

### Status of Fixes (Day 2 Deliverable)

- **Bug 2 (Pagination Off-By-One):** Fixed as primary focus for Day 2 Part B.
- **Bug 1 (Status Substring Matching):** Fixed using strict equality (`===`) so status queries match exact enums.
- **Bug 3 (Priority Reset on Complete):** Fixed by removing the hardcoded priority mutation in `completeTask`.

**Test Status:** All 48 tests (44 initial/feature tests + 4 bug-verification tests) now pass with 0 failures.

