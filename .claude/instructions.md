# Project-Specific Instructions for Claude

## Core Principles

1. **Test-Driven Development** - Tests are not optional; they're part of the definition of done
2. **Documentation as Code** - Keep docs updated with every change; stale docs create ambiguity
3. **Clean Git History** - Frequent, atomic commits with clear messages tell the project's story
4. **No Ambiguity** - When in doubt, document it; when unclear, clarify before proceeding

---

## Software Engineering Best Practices

### Git Workflow

**Commit Frequency & Quality**:

- Commit after each logical unit of work (not at end of session)
- One commit = one purpose (don't mix features, fixes, and refactors)
- Commit working code only (build and lint should pass)

**Commit Message Format**:

```
type(scope): concise description

- Bullet points for details if needed
- Reference issue numbers when applicable

🧪 Tests: filename.spec.ts - what was tested
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`

**Examples**:

```
feat(crm): add custom object creation wizard

- 5-step wizard: basic info, features, appearance, fields, review
- Auto-generates API name from label
- Validates uniqueness before creation

🧪 Tests: custom-objects.spec.ts - wizard flow, field creation
```

```
fix(messaging): resolve unread count not updating on new message

- Added realtime subscription for conversation_participants
- Fixed race condition in mark_conversation_read

🧪 Tests: messaging-realtime.spec.ts - unread badge updates
```

**Branching Strategy**:

- `main` - Production-ready code
- `feature/phase-13-launch-prep` - For multi-day feature work
- `fix/issue-description` - For bug fixes

**When to Branch**:

- Multi-day feature work
- Experimental changes
- Breaking changes that need review

**When NOT to Branch** (commit directly to main):

- Small fixes (< 1 hour)
- Documentation updates
- Test additions for existing features

### Testing Requirements

**Every Feature Must Have**:

1. **E2E Tests** (Playwright) - User-facing functionality
2. **Edge Cases** - Error states, empty states, boundary conditions
3. **Mobile Viewport** - Test responsive behavior where applicable

**Test-First Approach**:

1. Write test describing expected behavior
2. Implement feature to make test pass
3. Refactor while keeping tests green

**Test File Naming**:

- `feature-name.spec.ts` for new features
- Add to existing spec file if extending a feature
- Keep tests in `tests/e2e/` organized by domain (crm/, admin-, client-)

**Test Quality Checklist**:

- [ ] Tests are idempotent (can run repeatedly)
- [ ] Tests clean up after themselves
- [ ] Tests don't depend on specific data state
- [ ] Tests use semantic locators (`getByRole`, `getByLabel`) not CSS selectors
- [ ] Tests handle async operations properly (no arbitrary waits)

**Running Tests**:

```bash
pnpm test:e2e                              # Run all tests
pnpm test:e2e tests/e2e/feature.spec.ts    # Run specific file
pnpm test:e2e --ui                         # Interactive UI mode
pnpm test:e2e --debug                      # Debug mode with inspector
pnpm test:e2e --grep "test name"           # Run tests matching pattern
```

### Code Quality Standards

**Before Every Commit**:

```bash
pnpm type-check    # TypeScript errors = blocked
pnpm lint          # Lint errors = blocked
pnpm build         # Build errors = blocked
```

**Code Review Checklist** (self-review before commit):

- [ ] No console.logs left in production code
- [ ] No commented-out code blocks
- [ ] No hardcoded values that should be config
- [ ] Error handling for all async operations
- [ ] Loading states for async UI
- [ ] Proper TypeScript types (no `any` without justification)

---

## Planning & Documentation Requirements

### Before Starting Any Work

1. **Check MASTER_PLAN.md** (`docs/MASTER_PLAN.md`) for current phase and priorities
2. **Review CLAUDE.md** for technical context and recent changes
3. **Verify E2E tests pass** before making changes: `pnpm test:e2e`
4. **Understand the scope** - If unclear, ask before coding

### During Work

1. **Commit frequently** - After each working milestone
2. **Update tests** - Add/modify tests as you implement
3. **Note discoveries** - If you find issues or tech debt, document immediately

### After Completing Work

1. **Run full test suite**: `pnpm test:e2e`
2. **Update MASTER_PLAN.md** with progress:
   - Mark completed tasks
   - Add discovered issues to Technical Debt section
   - Update phase status if completing a phase
3. **Update CLAUDE.md** if:
   - New files were created
   - Architecture changed
   - New patterns introduced
4. **Final commit** with documentation changes included
5. **Verify build**: `pnpm build`

### Documentation Update Triggers

**Must Update CLAUDE.md When**:

- Creating new server actions
- Adding new pages/routes
- Creating new component directories
- Introducing new patterns or conventions
- Changing database schema
- Adding new dependencies

**Must Update MASTER_PLAN.md When**:

- Completing a planned task
- Discovering new issues or tech debt
- Changing priorities or scope
- Completing or starting a phase

**Must Update CRM-ARCHITECTURE.md When**:

- Adding new CRM features
- Changing data models
- Modifying API contracts

### Phase Transitions

When completing a phase:

1. Update MASTER_PLAN.md phase status to "✅ Complete"
2. Add completion date
3. Move any incomplete items to next phase or backlog
4. Create summary of what was accomplished
5. Commit with message: `docs: complete phase X - [summary]`

### Ad-Hoc Feature Work

When doing work outside the planned phases:

1. Document what was done in CLAUDE.md under appropriate section
2. If it's a significant feature, add it to MASTER_PLAN.md's completed work
3. Note if it affects the roadmap or priorities
4. Consider if it should become a formal phase task

---

## Documentation Hierarchy

1. **MASTER_PLAN.md** - Single source of truth for planning and roadmap
2. **CLAUDE.md** - Technical implementation details and quick reference
3. **docs/CRM-ARCHITECTURE.md** - Feature-specific technical documentation
4. **docs/TESTING.md** - E2E testing patterns and guidelines
5. **~/.claude/plans/** - Historical only, do not use for current planning

---

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server

# Quality Checks
pnpm type-check       # TypeScript check
pnpm lint             # ESLint check
pnpm lint:fix         # Auto-fix lint issues

# Testing
pnpm test:e2e         # Run all E2E tests
pnpm test:e2e --ui    # Interactive test UI
pnpm test:e2e --debug # Debug mode
pnpm test:e2e tests/e2e/specific.spec.ts  # Run specific file

# Database
supabase db push      # Apply migrations to remote
supabase db reset     # Reset local database
supabase gen types    # Generate TypeScript types

# Git (examples)
git add -p            # Stage changes interactively
git commit -m "type(scope): message"
git log --oneline -10 # View recent commits
```

---

## Test Credentials

- Admin Email: chase.d.harmon@gmail.com
- Admin Password: TestPassword123!

---

## Learning & Continuous Improvement

### Document Failures and Resolutions

When encountering bugs, test failures, or unexpected behavior:

1. **Document the issue** in CLAUDE.md under appropriate section:
   - What was the symptom?
   - What was the root cause?
   - What was the fix?

2. **Add to Technical Debt** in MASTER_PLAN.md if it reveals a broader issue

3. **Update tests** to prevent regression:
   - Add test case that would have caught the issue
   - Update existing tests if they were incorrect

4. **Create patterns** for common issues:
   - If you solve the same type of problem twice, document the pattern
   - Add to CLAUDE.md's technical notes section

### Example Failure Documentation

```markdown
### Bug: Unread count not updating on new message (Dec 12, 2025)

**Symptom**: Badge showed stale count after receiving message
**Root Cause**: Realtime subscription wasn't filtering by conversation_id
**Fix**: Added .eq('conversation_id', id) to subscription filter
**Prevention**: Added test in messaging-realtime.spec.ts for badge updates
```

### Knowledge Accumulation

- **Patterns that work** - Document in CLAUDE.md's technical notes
- **Patterns that failed** - Document why they failed to avoid repeating
- **Third-party quirks** - Note any Supabase, Radix UI, or library gotchas
- **Test locator patterns** - Document what selectors work reliably

---

## Anti-Patterns to Avoid

1. **"I'll add tests later"** - Tests are part of the feature, not an afterthought
2. **Giant commits** - If commit message needs "and" multiple times, split it
3. **Stale documentation** - If you change code, change docs in same commit
4. **Magic numbers/strings** - Use constants and configuration
5. **Ignoring TypeScript errors** - Fix them, don't suppress them
6. **Skipping code review** - At minimum, self-review before commit
7. **Assuming tests pass** - Always run tests after changes
8. **Undocumented decisions** - If you chose A over B, document why
9. **Repeating mistakes** - If you hit an issue twice, document it immediately
