# GreenLife Frontend — Production Release Checklist

This checklist contains all necessary steps and guidelines for preparing, building, and deploying the GreenLife React + TypeScript application into production.

---

## 1. Environment Setup & Hardening

- [ ] **Configure Variables**: Copy `.env.example` to `.env` in the root of the frontend repository.
- [ ] **Set API Base URL**: Define `VITE_API_BASE_URL` to match the secure production backend (e.g., `https://api.greenlife.vn`).
- [ ] **Set API Timeout**: Define `VITE_API_TIMEOUT` (defaults to `15000` milliseconds).
- [ ] **Disable Info/Warn Logs**: Ensure the environment is set to `production` (default when building with Vite) to automatically strip verbose console logs.

---

## 2. Dependency Management & Security Audit

- [ ] **Clean Install**: Run `npm ci` or `npm install` to ensure reproducible, clean dependencies.
- [ ] **Vulnerability Scan**: Run `npm audit` to check for security vulnerabilities.
- [ ] **HTML Sanitizer**: Ensure `dompurify` is in place for securing all `dangerouslySetInnerHTML` elements against XSS.

---

## 3. Strict Quality Check & Verification

- [ ] **TypeScript Check**: Execute `npx tsc --noEmit` and confirm exit code is `0`.
- [ ] **Production Build**: Execute `npm run build` and confirm all chunks build cleanly without warnings or errors.
- [ ] **A11y Compliance**: Verify that all interactive modal controls (such as the Cart Drawer) support accessibility features:
  - Close-on-Escape keybinds
  - Clear `aria-label` values for buttons
  - Proper `aria-busy` and indicator roles during loading

---

## 4. Deploy & Rollback Procedures

### Deployment
- The build assets will be located in the `dist/` directory.
- Deploy the content of `dist/` to your static hosting provider (e.g., Netlify, Vercel, AWS S3, or Nginx).

### Rollback Procedures
In the event of runtime issues or deployment anomalies:
1. **Restore Previous Stable Build**: Keep a backup of the previous `dist/` bundle or deploy the previous git tag.
2. **Configuration Reversion**: Revert environment variables to the last known working state in `.env`.
3. **Verify Health**: Confirm compilation and deployment using the verification suite.
