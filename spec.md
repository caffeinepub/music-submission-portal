# Music Submission Portal

## Current State
Public form with: Band/Artist Name, Website, Artist Bio, Social Links (Instagram, Facebook, Spotify, SoundCloud, X/Twitter), EPK upload, 3 track uploads.

## Requested Changes (Diff)

### Add
- Genre dropdown (required) + Specific Genre text (optional) after Band/Artist Name row
- YouTube in Social Links
- Your Name, Your Email, Role/Position dropdown (required, same line) in Music Tracks section
- Backend: genre, specificGenre, submitterName, submitterEmail, submitterRole; youtube in SocialLinks

### Modify
- submitBand backend signature
- Admin dashboard display

### Remove
- Artist Bio
- Facebook and X/Twitter social fields

## Implementation Plan
1. Update Motoko backend
2. Update SubmissionForm.tsx
3. Update AdminDashboard.tsx
