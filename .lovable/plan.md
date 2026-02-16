

# Add Cloudflare Turnstile CAPTCHA to Auth Page

## Overview
Integrate Cloudflare Turnstile CAPTCHA protection on the auth page using `@marsidev/react-turnstile`. The CAPTCHA widget will appear before the sign-in buttons, and the captcha token will be passed to Supabase auth calls.

## Changes

### 1. Install dependency
- Install `@marsidev/react-turnstile` package

### 2. Update `src/pages/Auth.tsx`
- Import `Turnstile` from `@marsidev/react-turnstile`
- Add `captchaToken` state: `const [captchaToken, setCaptchaToken] = useState<string | null>(null)`
- Add the `<Turnstile>` widget in the card content (above the GitHub button) with:
  - `siteKey="0x4AAAAAACd8U7GjZowz43NG"`
  - `onSuccess={(token) => setCaptchaToken(token)}`
- Pass `captchaToken` to both auth methods:
  - GitHub OAuth: `options: { captchaToken, redirectTo: ... }`
  - Guest sign-in: `options: { captchaToken }` passed to `signInAnonymously()`
- Disable sign-in buttons until `captchaToken` is available (buttons disabled when `loading || !captchaToken`)
- Reset captcha token after failed attempts so the user must re-verify

### Technical Detail

The Supabase `signInWithOAuth` and `signInAnonymously` methods both accept `options.captchaToken`. When CAPTCHA protection is enabled in the Supabase dashboard (under Authentication > Bot Detection), Supabase validates this token server-side before proceeding with authentication.

**Prerequisite**: CAPTCHA (Turnstile) must also be enabled in the Supabase dashboard under Authentication > Bot Detection (CAPTCHA), selecting Cloudflare Turnstile as the provider and entering the corresponding secret key.

