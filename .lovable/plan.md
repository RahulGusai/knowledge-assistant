

## Client-Side Chat History Service

### Overview
Create a chat history service using `sessionStorage` to persist chat messages across page navigations within the same browser session. The history will be cleared when the user logs out.

### Implementation Steps

1. **Create `src/services/chatHistoryService.ts`** - A simple service that reads/writes chat messages to `sessionStorage` using a consistent key. It will handle serialization/deserialization (including `Date` objects for timestamps) and provide `getMessages()`, `saveMessages()`, and `clearHistory()` methods.

2. **Update `src/components/ChatAssistant.tsx`** - Initialize the `messages` state from `chatHistoryService.getMessages()` instead of an empty array. Add an `useEffect` that persists messages to `sessionStorage` whenever they change.

3. **Update `src/contexts/AppContext.tsx`** - Import and call `chatHistoryService.clearHistory()` inside the `clearWorkspace()` method, which is already called on logout.

4. **Update `src/pages/Dashboard.tsx`** - Import and call `chatHistoryService.clearHistory()` in the `handleLogout` function alongside the existing sign-out logic.

### Technical Details

- **Storage**: `sessionStorage` (survives page refreshes and navigation, but clears when the browser tab is closed)
- **Key**: `CHAT_HISTORY` constant in `src/constants/storage.ts`
- **Serialization**: JSON with Date reconstruction on deserialization
- **Clear triggers**: Both logout paths (`ProtectedRoute.handleLogout` and `Dashboard.handleLogout`) flow through `clearWorkspace()` in `AppContext`, so adding the clear call there covers both cases. The Dashboard logout will also get a direct clear call for safety.

### Files to Create
- `src/services/chatHistoryService.ts`

### Files to Modify
- `src/constants/storage.ts` (add `CHAT_HISTORY` key)
- `src/components/ChatAssistant.tsx` (load and persist messages)
- `src/contexts/AppContext.tsx` (clear history on workspace clear)
- `src/pages/Dashboard.tsx` (clear history on logout)

