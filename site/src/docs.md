# Captain Hook Documentation

Captain Hook is a webhook translator and scheduling engine powered by [safescript](https://github.com/uriva/safescript). It allows you to transform incoming webhook payloads, schedule cron tasks, and schedule deferred runs at arbitrary timestamps—all with static analysis that proves exactly what your script does before any code executes.

---

## 1. Secrets Management

Captain Hook supports a built-in **Secrets Manager** to securely store environment-specific key-value pairs (like Slack tokens, database credentials, Stripe keys, etc.) that your translation and execution scripts can access.

### How it Works
1. You register secrets (e.g., name `slack-token`) on your route's settings page.
2. In your safescript, you read the secret using:
   ```typescript
   token = readSecret({ name: "slack-token" })
   ```
3. **Static Analysis Proof:** Before your script runs, Captain Hook statically analyzes the AST of your safescript. If the script attempts to read a secret that has not been explicitly allowed in the route's permissions, execution is blocked with a `403 Permission Denied` error.

---

## 2. Timing (Cron-like Triggers)

Captain Hook supports scheduled triggers that execute your safescripts on a recurring cron schedule (up to hourly frequency).

### How it Works
1. When creating or configuring a route, you can set its `triggerType` to `"cron"`.
2. Provide a standard 5-field cron expression (e.g., `0 * * * *` for hourly at minute 0).
3. The server runs an automated background ticker that matches cron expressions against the current UTC time.
4. When a cron route is triggered, the script executes with an empty input object `{}` and logs the execution result under the events logs.

---

## 3. API-driven Scheduled Runs

Captain Hook supports a highly efficient, serverless, and robust API to schedule a script's run at a precise timestamp point in the future powered natively by **Upstash QStash**.

### How it Works
When you schedule a run:
1. The server registers the delayed message directly in Upstash QStash using the exact epoch timestamp.
2. At the scheduled time, Upstash forwards the payload as an HTTP POST back to our execution endpoint.
3. Upstash handles retries, queue persistence, and high-precision execution with zero idle costs on our Deno Deploy server.
4. If the server does not have the `QSTASH_TOKEN` environment variable set, scheduling requests will immediately fail with a `500 Configuration Error` explaining that the token is required.

### Scheduling API (`POST /w/:routeId/schedule`)
Schedule a route execution by making an HTTP POST request to your route's schedule URL.

* **URL:** `POST /w/:routeId/schedule`
* **Request Body (JSON):**
  - `timestamp` (Required): A Unix epoch millisecond timestamp (number) or an ISO-8601 string (e.g., `"2026-06-17T15:30:00Z"`).
  - `payload` (Optional): A JSON object or string passed directly as `input.payload` to your safescript.
* **Example Curl Request:**
  ```bash
  curl -X POST https://captain-hook.uriva.deno.net/w/your-route-id/schedule \
    -H "Content-Type: application/json" \
    -d '{
      "timestamp": "2026-06-17T15:30:00Z",
      "payload": {
        "userId": "usr_12345",
        "action": "trial_expiry_warning"
      }
    }'
  ```
* **Success Response (201 Created):**
  ```json
  {
    "ok": true,
    "id": "scheduled-run-uuid",
    "routeId": "your-route-id",
    "timestamp": 1781796600000,
    "status": "scheduled",
    "qstashMessageId": "msg_..."
  }
  ```
