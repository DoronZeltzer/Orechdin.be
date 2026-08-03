# Platform Architecture: Neo Legal Intake

## Core Flow (Authenticated Case Building)

1. **Discovery (Public)**: Visitors interact with the public front-door. They browse practice areas wrapped in highly stylized `SectionShell` components with deep slate and sapphire legal-tech branding.
2. **Identity Creation (`/sign-up`)**: Better Auth registers the user payload into the local SQLite database.
3. **Verification (`/verify-email`)**: A secure payload verifies the user's communication channel via Better Auth email hooks.
4. **Encrypted Vault (`/api/uploadthing`)**: Authenticated users can transmit documentation via AES-equipped object storage (UploadThing) safely attached to their specific `caseDraftId`.
5. **Dossier Finalization**: The Neo Orchestrator evaluates the context and document presence. If sufficient (`score >= 3`), Drizzle ORM fires a transaction finalizing the `caseDrafts` into the `caseSubmissions` SQL table, generating a tracking routing number.

## Data Schema (Local SQLite / Drizzle)

- `users`: Identity and Better Auth integration.
- `caseDrafts`: The active mutable state of the Neo conversation.
- `caseMessages`: Chronological chat blocks linked to the draft.
- `caseFiles`: References to physical blobs hosted on UploadThing.
- `caseSubmissions`: The immutable lawyer-facing handover document linked to `case_routes`.
