

## Fix: Persist Chat Query Across Navigation

### Problem
When you send a message to the assistant and navigate away before the response arrives, the `ChatAssistant` component unmounts. This kills the in-flight API request and resets the loading state, so when you return, the "Thinking..." animation is gone and no response ever appears.

### Solution
Move all chat state and logic (messages, loading state, send function) out of the `ChatAssistant` component and into a **ChatContext** that lives at the app level. Since the context stays mounted regardless of which page you're on, the API call continues in the background and the response is captured even if you navigate away.

### What Changes

1. **Create `src/contexts/ChatContext.tsx`**
   - Holds `messages`, `isLoading`, `input`, and `sendMessage` logic
   - Initializes messages from `chatHistoryService`
   - Persists messages to `sessionStorage` on change
   - The fetch call lives here, so it survives component unmounts
   - Exposes a `clearHistory()` method for logout

2. **Update `src/App.tsx`**
   - Wrap the app with `<ChatProvider>` (inside `AppProvider` so it has access to `workspaceId`)

3. **Simplify `src/components/ChatAssistant.tsx`**
   - Remove all state management and API logic
   - Consume `messages`, `isLoading`, `input`, `setInput`, `sendMessage` from `ChatContext`
   - Becomes a pure presentation component

4. **Update `src/contexts/AppContext.tsx`** and **`src/pages/Dashboard.tsx`**
   - Replace direct `chatHistoryService.clearHistory()` calls with the context's clear method (or keep both for safety)

### Files to Create
- `src/contexts/ChatContext.tsx`

### Files to Modify
- `src/App.tsx` (add ChatProvider)
- `src/components/ChatAssistant.tsx` (consume context instead of managing state)
- `src/contexts/AppContext.tsx` (minor adjustment for clearing)
- `src/pages/Dashboard.tsx` (minor adjustment for clearing)

### Technical Details
- The context pattern ensures the `fetch()` Promise continues resolving even when `ChatAssistant` is not rendered
- `useRef` will be used for `startTime` tracking so it persists across re-renders
- The `sessionStorage` persistence layer remains unchanged
- No new dependencies required

