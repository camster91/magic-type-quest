# Google API key incident closure

Use this playbook to close the exposed-provider-credential gate in
`docs/LAUNCH-READINESS.md`. Removing a key from Git does not invalidate copies
already present in history or logs. The gate remains open until an authorized
Google Cloud administrator completes and records the provider-side action.

Official references:

- [Manage and rotate API keys](https://docs.cloud.google.com/docs/authentication/api-keys)
- [API key security best practices](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- [API Keys audit logging](https://docs.cloud.google.com/api-keys/docs/audit-logging)

## Safety rules

- Never paste the exposed key string into an issue, commit, screenshot, chat,
  shell history, or evidence record.
- Identify it by Google Cloud project, non-secret key ID, display name, and a
  separately stored redacted fingerprint only if the owner already has one.
- Use an administrator with the minimum API Keys permissions and an approved
  Google Cloud session. Do not grant repository automation permission to manage
  provider credentials.
- Treat unknown usage as compromise. Do not preserve the old key merely because
  the current repository no longer references it.

## Closure procedure

1. Identify the owning Google Cloud project and the exposed key in the
   Credentials page or with `gcloud services api-keys list`. Confirm the key ID;
   the key ID is not the secret key string.
2. Record the exposure window from the earliest known committed revision until
   provider invalidation. Review API usage, quotas, billing, alerts, and relevant
   Cloud Logging for that window. In Logs Explorer, API-key administration
   events can be queried with:

   ```text
   protoPayload.serviceName="apikeys.googleapis.com"
   ```

3. If no approved consumer still needs the key, delete it immediately. If an
   approved consumer still needs access, create or rotate to a replacement,
   update that consumer from an approved secret manager, verify it, and then
   delete the exposed previous key. Do not put the replacement into this
   repository.
4. For any replacement, restrict it to only the required API—currently the
   asset tools use `generativelanguage.googleapis.com`—and add the narrowest
   supported application restriction. Google recommends both API and
   application restrictions. Record why any restriction cannot be applied.
5. Confirm the old key is in deleted state. Google permits restoration of a
   deleted key for 30 days, so record the deletion timestamp and assign an owner
   to confirm it was not restored. After the recovery window, verify it is no
   longer recoverable.
6. Review IAM access to API-key administration, remove unnecessary principals,
   and confirm monitoring or budget alerts appropriate to the project are
   active. Escalate anomalous usage or charges through the owner's incident and
   billing process.
7. Re-run the repository credential tests and tracked-source scan. Provider
   evidence and repository evidence are both required; neither substitutes for
   the other.

## Acceptance evidence

The gate passes only when all of the following are recorded without secret
values:

- Google Cloud project identifier and non-secret old key ID;
- administrator and action timestamp;
- deletion or completed rotation decision;
- provider evidence that the exposed key is deleted;
- exposure-window usage, quota, billing, and log review result;
- incident/billing ticket for any anomaly, including owner and status;
- replacement key ID, API/application restrictions, secret-storage location,
  and consumer verification, if a replacement exists;
- 30-day non-restoration owner and follow-up evidence;
- repository scan/test commit and passing CI link;
- product-owner decision and timestamp.

Screenshots must redact key strings, tokens, account identifiers not approved
for publication, and unrelated project data. Store sensitive evidence in the
approved incident system and place only its non-secret reference in the launch
register.

## Evidence record

Copy this section into the approved incident system or a suitably redacted file
under `docs/evidence/`.

- Google Cloud project:
- Exposed key ID and display name (never the key string):
- Exposure window:
- Administrator and timestamp:
- Decision: Deleted / Rotated then deleted
- Provider deletion evidence:
- Usage, quota, billing, and log review result:
- Anomaly ticket and owner, if applicable:
- Replacement key ID and restrictions, if applicable:
- Replacement secret-storage and consumer verification:
- IAM and monitoring review:
- 30-day non-restoration owner, due date, and result:
- Repository scan/test commit and CI:
- Product-owner decision and timestamp:
- Gate result: Pass / Fail / Blocked
