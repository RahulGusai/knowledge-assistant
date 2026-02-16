
# Minimalistic Auth Page Update

## Changes Overview

We will simplify the auth page to have two clear options: GitHub sign-in (primary) and Guest access (secondary), removing all email/password UI.

## What Will Change

### 1. Update subtitle text
- Change "Sign in to access your RAG chatbot dashboard" to "Sign in to access your knowledge assistant"
- Remove the sign-up variant text since there's no email form

### 2. Remove email/password form
- Remove the email and password input fields, labels, and submit button
- Remove the `isSignUp`, `email`, `password` state variables
- Remove the `handleEmailAuth` function
- Remove unused imports (`Input`, `Label`, `Mail`, `Alert`, `AlertDescription`)

### 3. Reorganize layout
- GitHub button becomes the primary CTA (using `default` variant instead of `outline`)
- Below the separator ("Or continue with"), add a "Continue as Guest" button (using `outline` variant)
- Update the card title to just "Welcome" (no sign-up toggle)

### 4. Add Guest sign-in via Supabase Anonymous Auth
- Add a `handleGuestAuth` function that calls `supabase.auth.signInAnonymously()`
- This creates an anonymous authenticated user in Supabase with the `authenticated` role
- The anonymous user gets a valid session and JWT, just like a regular user
- Note: Anonymous sign-ins must be enabled in the Supabase dashboard under Authentication > Providers > Anonymous Sign-Ins

### 5. Remove sign-up/sign-in toggle
- Remove the bottom toggle link ("Don't have an account? Sign up")

## Technical Details

**File to modify:** `src/pages/Auth.tsx`

Key changes:
- Replace `handleEmailAuth` with `handleGuestAuth` using `supabase.auth.signInAnonymously()`
- Promote GitHub button to primary style (`default` variant, full width, larger)
- Add separator + Guest button below
- Clean up unused state and imports
- Update the icon in the header (replace `Mail` with a more generic icon like `LogIn` or keep `Github`)

**Important prerequisite:** Anonymous sign-ins must be enabled in the Supabase dashboard (Authentication > Providers > Anonymous Sign-Ins toggle). Without this, `signInAnonymously()` will return an error.
