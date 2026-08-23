# Supabase email templates (required for mobile + password reset)

Default Supabase emails use **PKCE** links (`{{ .ConfirmationURL }}`). Those links **only work in the same browser** where the user clicked Sign up / Forgot password.

If email opens in Gmail app, another browser, or phone mail app → link fails with “expired or invalid” even after 1 minute.

**Fix:** Use `token_hash` links in Supabase email templates (one-time setup in Dashboard).

---

## Where to update

Supabase Dashboard → **Authentication** → **Email Templates**

Project: `ownfexksfpkfojxyjwwv`

Also check **URL Configuration**:

- Site URL: `https://vouchers.propertywithmanish.com`
- Redirect URLs include:
  - `https://vouchers.propertywithmanish.com/**`
  - `https://vouchers.propertywithmanish.com/auth/confirm`
  - `https://vouchers.propertywithmanish.com/auth/reset-password`

---

## 1) Reset Password template (IMPORTANT)

Replace the reset link with:

```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password for PWM Expense Vouchers:</p>
<p>
  <a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery">
    Reset password
  </a>
</p>
<p>If you did not request this, you can ignore this email.</p>
```

**Do not use** `{{ .ConfirmationURL }}` for reset password.

---

## 2) Confirm signup template (if not already updated)

```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your account:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
    Confirm email
  </a>
</p>
```

---

## After saving templates

1. Request a **new** reset email (old links stay broken)
2. Open the new email link — works on any device/browser
3. You land on Profile → set new password

---

## Quick test

1. Login page → wrong password once → **Forgot password?**
2. Open email → click link
3. Should show “Verifying reset link…” then Profile with **Set new password**
