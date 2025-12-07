# E2E Testing Guide

## Setup

1. **Add your test admin password** to `.env.local`:

   ```env
   TEST_ADMIN_PASSWORD=your-actual-admin-password
   ```

2. **Install Playwright browsers** (if not already done):
   ```bash
   pnpm exec playwright install
   ```

## Running Tests

### Run all CRM tests

```bash
pnpm test:e2e
```

### Run tests in UI mode (interactive)

```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
pnpm exec playwright test --headed
```

### Run specific test file

```bash
pnpm exec playwright test tests/e2e/admin-crm.spec.ts
```

### Run specific test by name

```bash
pnpm exec playwright test -g "should submit contact form"
```

## Test Coverage

The automated tests cover:

### Authentication

- ✅ Redirect unauthenticated users to login
- ✅ Admin login with valid credentials
- ✅ Show error for invalid credentials
- ✅ Sign out functionality

### Dashboard

- ✅ Display stats cards (Total Leads, New Leads, Active Clients)
- ✅ Show recent leads section
- ✅ Navigation and branding

### Contact Form Lead Capture

- ✅ Submit form and create lead in database
- ✅ Validate required fields
- ✅ Validate email format
- ✅ Validate minimum message length (10 characters)
- ✅ Lead appears in admin dashboard
- ✅ Stats update after new lead

### Newsletter Signup

- ✅ Submit newsletter signup and create lead
- ✅ Prevent duplicate signups
- ✅ Lead appears in admin dashboard with "Newsletter" source

### Stats Updates

- ✅ Total leads count updates after new submission
- ✅ New leads count updates correctly

## What Each Test Does

### `should submit contact form and create lead`

1. Generates unique email with timestamp
2. Fills out complete contact form
3. Submits and verifies success message
4. Logs into admin dashboard
5. Confirms lead appears with correct data

### `should validate minimum message length`

This test reproduces the error you saw in the screenshot:

- Enters message with < 10 characters
- Verifies form validation prevents submission
- Ensures user gets feedback about validation error

## Debugging Tests

### View test results

```bash
pnpm exec playwright show-report
```

### Debug a specific test

```bash
pnpm exec playwright test --debug -g "contact form"
```

### Take screenshots on failure

Tests automatically take screenshots on failure in `test-results/` directory

## CI/CD Integration

These tests can run in GitHub Actions or your CI pipeline:

```yaml
- name: Run E2E tests
  run: pnpm test:e2e
```

## Best Practices

1. **Always use unique emails** - Tests generate timestamps to avoid conflicts
2. **Clean up test data** - Consider adding cleanup scripts for test leads
3. **Run before deploying** - Ensure all tests pass before production deploy
4. **Update tests when features change** - Keep tests in sync with your app

## Troubleshooting

### Tests timeout

- Increase timeout in `playwright.config.ts`
- Check dev server is running on port 3000

### Tests fail with "element not found"

- Element selectors may have changed
- Update selectors in test file
- Use Playwright Inspector to find correct selectors

### Database state issues

- Tests create real data in your database
- Consider using a separate test database
- Or add cleanup between test runs
