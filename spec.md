# Music Submission Portal

## Current State
- Backend `access-control.mo` uses dynamic "first login = admin" logic
- `getUserRole` traps (Runtime.trap) for unregistered principals
- Admin principal `mqpqn-...` is NOT hardcoded in access control
- `getCallerUserRole` query throws for any unregistered user including the intended admin
- Frontend `Header.tsx` depends on `getCallerUserRole` returning `UserRole.admin` to show Dashboard link
- Form submission IDL error related to socialLinks passing `undefined` values

## Requested Changes (Diff)

### Add
- Hardcoded admin principal constant in `access-control.mo`

### Modify
- `access-control.mo`: hardcode `mqpqn-qsle4-usj5i-uytxj-pzbwu-3ppcx-cqjq5-qtktf-nwxvx-szbij-bae` as permanent admin; `getUserRole` returns `#guest` instead of trapping for unknown users; `isAdmin` checks hardcoded principal directly
- `SubmissionForm.tsx`: pass social links cleanly (omit undefined keys rather than passing undefined values) to avoid IDL encoding issues

### Remove
- Nothing

## Implementation Plan
1. Rewrite `access-control.mo` to hardcode admin principal, fix getUserRole to not trap
2. Fix SubmissionForm socialLinks construction to only include non-empty values
