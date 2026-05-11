# Microsoft Graph — Work Location Setup

This service reads each user's per-day Outlook work location ("Office" / "Remote" /
specific building) via Microsoft Graph and exposes it at:

```
GET /api/work-location?user=<upn-or-id>&start=YYYY-MM-DD&end=YYYY-MM-DD
```

Auth is **app-only / client credentials** — the service authenticates as itself
(not as a signed-in user) and can read any mailbox in the tenant.

---

## 1. Register the Azure AD app

1. Go to <https://portal.azure.com> → **Microsoft Entra ID** (formerly Azure AD)
   → **App registrations** → **New registration**.
2. Name it (e.g. `find-my-desk-graph`). Leave **Supported account types** as
   *Single tenant*. **No redirect URI** is needed for client credentials.
3. Click **Register**.
4. On the app's **Overview** page, copy:
   - **Application (client) ID** → goes into `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → goes into `AZURE_TENANT_ID`

## 2. Create a client secret

1. **Certificates & secrets** → **Client secrets** → **New client secret**.
2. Pick an expiry (6 months is fine for a hackathon) and click **Add**.
3. **Copy the secret's `Value` immediately** — it's only shown once.
   → goes into `AZURE_CLIENT_SECRET`.

## 3. Grant the Graph permission

1. **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Application permissions** (NOT delegated).
2. Search for and tick both:
   - `Calendars.Read` — required, to read events
   - `User.Read.All` — required, used to pre-check that the target UPN exists
     and has a mailbox before hitting `/calendarView` (turns generic Graph 404s
     into clear 404/409 errors at the API)
3. Click **Add permissions**.
4. Back on the API permissions list, click **Grant admin consent for <tenant>**.
   Both rows should turn into a green check.
   **Without this step every Graph call returns 403.**

> Heads-up: `Calendars.Read` (application) grants the app access to **every**
> mailbox in the tenant. If your tenant admin has configured an
> [Application Access Policy](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access),
> you'll only be able to read mailboxes inside the policy's scope.

## 4. Drop the values into local config

Either populate `api/.env` (copy from `api/.env.example`) **or**
`api/local.settings.json` — the Azure Functions host reads `local.settings.json`
automatically on `func start`; `python-dotenv` (already in requirements) picks
up `.env`. Don't commit either file — both are gitignored.

```json
// api/local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "AZURE_TENANT_ID": "<tenant-id>",
    "AZURE_CLIENT_ID": "<client-id>",
    "AZURE_CLIENT_SECRET": "<secret-value>"
  }
}
```

---

## 5. Run and test locally

From `api/`:

```bash
pip install -r requirements.txt
func start
```

The Functions host will print something like
`Functions: http_trigger: [GET,POST] http://localhost:7071/api/{*route}`.

### Smoke-test the auth + Graph call first

Before debugging the work-location classification, confirm the token + Graph
call work end-to-end. Pick any user in your tenant and hit:

```bash
curl "http://localhost:7071/api/work-location?user=alice@yourtenant.onmicrosoft.com&start=2026-05-11&end=2026-05-17"
```

Expected shape:

```json
{
  "user": "alice@yourtenant.onmicrosoft.com",
  "days": [
    {"date": "2026-05-11", "location": "office", "source": "businessAddress: HQ - Floor 2"},
    {"date": "2026-05-12", "location": "remote", "source": "homeAddress"},
    {"date": "2026-05-13", "location": "unknown", "source": null},
    ...
  ]
}
```

### Setting up test data

In Outlook on the web (`outlook.office.com`), open the calendar in **Day** or
**Week** view. At the top of each day there's a small "Work location" pill
(Office / Remote / specific building) — set a mix across the next 7 days for
the test user. These are what Graph returns as events with
`locations[].locationType = businessAddress | homeAddress`.

### Common errors

| Symptom | Cause |
|---|---|
| `Token acquisition failed: invalid_client` | Wrong client secret, or you copied the secret's **ID** instead of **Value** |
| `Graph 403 ... ErrorAccessDenied` | Admin consent not granted on `Calendars.Read`, or an Application Access Policy excludes this mailbox |
| HTTP 404 `No directory user for ...` | UPN typo, or the user doesn't exist in this tenant |
| HTTP 409 `User exists but has no Exchange Online mailbox` | The directory user has no `mail` attribute — assign an Exchange-enabled license (E3/E5/Business Basic+) and wait ~5 min for provisioning |
| Graph 403 mentioning `User.Read.All` | Pre-check permission missing — add `User.Read.All` (application) and grant admin consent |
| All days come back `"unknown"` | The user never set Outlook work location — the heuristic doesn't invent data. Either set work locations in Outlook, or extend `classify_work_location` in `graph_calendar.py` to match on event subject/categories |

### Quick token-only check (optional)

If you want to verify the app registration without running the Functions host:

```bash
curl -X POST "https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token" \
  -d "client_id=$AZURE_CLIENT_ID" \
  -d "client_secret=$AZURE_CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

A 200 with an `access_token` field means auth is wired up correctly. Use that
token in an `Authorization: Bearer ...` header to hit
`https://graph.microsoft.com/v1.0/users/<upn>/calendarView?...` directly.
