# ZenstackConnectPermissionIssue

This repository reproduces a ZenStack V3 permission issue with many-to-many `connect` operations.

## Issue

When an authenticated user tries to create a `Child` record and simultaneously `connect` themselves as a parent (via a many-to-many relation), ZenStack's policy engine incorrectly blocks the operation:

```
ORMError: many-to-many relation participant model "Child" not updatable
reason: 'rejected-by-policy'
rejectedByPolicyReason: 'cannot-read-back'
```

The `Child` model allows `create` for any authenticated user (`@@allow('create', auth() != null)`), and `read/update` only for parents of that child. However, when trying to create a child and connect a parent in the same operation, the policy check for the join table update fails because the child hasn't been created yet (and thus has no parents to satisfy the read-back check).

## Setup

```bash
npm install
```

The `postinstall` script automatically:
1. Generates the ZenStack TypeScript schema (`zenstack generate`)
2. Pushes the schema to the SQLite database (`zenstack db push`)
3. Seeds the database with an initial user (`src/seed.ts`)

## Reproduce the Issue

```bash
npm start
```

This script:
1. Uses a non-authenticated client to retrieve the seeded user's ID
2. Creates an authenticated client using the user's ID
3. Attempts to create a `Child` record with `parents: { connect: { id: userId } }` using the authenticated client

## Expected Behaviour

The `create` operation should succeed because:
- The authenticated user satisfies `@@allow('create', auth() != null)` for `Child`
- The user is connecting themselves as a parent in the same operation

## Actual Behaviour

The operation fails with a policy rejection error indicating the many-to-many join table participant model is "not updatable".
