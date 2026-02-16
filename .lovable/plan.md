

## Fix: Persist Pipeline Running State Across Navigation + 15-Minute Hard Timeout

### Problem
1. Pipeline running state (`isRunning`, `progress`, realtime subscription) lives inside the `Pipeline` page component. When the user navigates away, the component unmounts, killing the realtime subscription and resetting all state.
2. There is currently a 5-minute "inactivity" timeout, but no hard ceiling. A stalled job could appear stuck indefinitely.

### Solution

Apply the same pattern used for ChatContext: lift the pipeline execution state (running flag, progress, realtime subscription, timeout) into `PipelineContext`, which stays mounted at the app level.

### What Changes

1. **Add constant to `src/constants/pipeline.ts`** (new file)
   - `PIPELINE_HARD_TIMEOUT_MS = 15 * 60 * 1000` (15 minutes)
   - Terminal status arrays (`TERMINAL_ERROR_STATUSES`, `KNOWN_HAPPY_STATUSES`)
   - Progress map and status messages (move from Pipeline.tsx)

2. **Update `src/contexts/PipelineContext.tsx`**
   - Add new state: `isRunning`, `progress`, `progressMessage`, `currentStatus`, `currentRunId`
   - Move the Supabase realtime subscription (`useEffect` with channel) here
   - Move the `handleTrigger` function here (rename to `triggerPipeline`)
   - Implement the 15-minute hard timeout: starts when trigger fires, cancels the job if no terminal status is reached within the window
   - Expose `isRunning`, `progress`, `progressMessage`, `currentStatus`, `triggerPipeline` via context

3. **Simplify `src/pages/Pipeline.tsx`**
   - Remove all local state for `isRunning`, `progress`, `progressMessage`, `currentStatus`, `currentRunId`, `timeoutId`
   - Remove the realtime subscription `useEffect`
   - Remove `handleTrigger` logic
   - Consume everything from `usePipeline()` context
   - Becomes a pure presentation component

### Files to Create
- `src/constants/pipeline.ts`

### Files to Modify
- `src/contexts/PipelineContext.tsx` (add running state, realtime sub, trigger logic, 15-min timeout)
- `src/pages/Pipeline.tsx` (simplify to presentation only)

### Technical Details
- The realtime Supabase channel will be managed inside `PipelineContext`, so it stays alive regardless of which page the user is viewing
- The 15-minute hard timeout starts at trigger time; if no terminal status (`completed`, `validation_failed`, `ingestion_failed`, `failed`, `cancelled`) is reached, the context sets `isRunning = false`, marks status as `cancelled`, and shows an error toast
- The existing 5-minute inactivity timeout (no status updates received) will be replaced by the single 15-minute hard timeout for simplicity
- A placeholder comment will be left for the future API call to mark the job as cancelled server-side
