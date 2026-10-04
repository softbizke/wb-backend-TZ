# Gate passes

Open **Gate Passes** in the application navigation. Captures enter the pending queue, which refreshes every 15 seconds. Open a record, correct the plate, and enter the driver and transporter details. Save before review. Plate and a driver selected from the Drivers module are required. Transporter and buying center are optional selections from their existing master modules; notes are optional (up to 2000 characters). The selectors use the same master lists as Products In.

Active administrators (the existing administrator ID 1, or roles named Admin/Administrator) and users with the Supervisor role can approve or reject. Permissions are checked against the database on every request. Approval and rejection are final in this version. Approved and rejected records are read-only. Rejection requires a reason. Only approved passes can be printed, including reprints.

The original camera plate is retained, including an empty plate when recognition fails. Every edit records changed values, user and timestamp. Reviews and successful submissions to the printer are also audited. Concurrent edits/reviews use row locking and version checks; refresh the record if another user has changed it.

## Installation

Run the new migrations against the intended application database, using your normal Knex configuration:

```sh
npx knex migrate:up 20261003000100_create_gate_passes.js --env development
npx knex migrate:up 20261004000100_gate_camera_roles_and_manual_scope.js --env development
npx knex migrate:up 20261004000200_gate_pass_master_details.js --env development
```

Restart the backend and build/deploy the UI using the existing workflow. Existing cameras and manual-mode requests default to the Weighbridge role/scope.

## Camera Management

In **Masters → Camera Management**, add or edit a camera and select the **Gate Pass** role. Enter its device ID (matching the camera's callback DeviceID) and a capture key of 16–255 characters. Configure the same key in the camera/integration as the `X-Camera-Key` header. Keys and camera credentials are stored in the database; camera environment variables are no longer used. Leave a key/password blank while editing to retain the current value.

Point the camera at `POST /api/gate-passes/capture` with `Content-Type: application/json`. Only active cameras assigned the Gate Pass role are accepted. Role, status and key changes take effect on the next callback without restarting the server. A camera linked to a weighbridge must first be unlinked before changing its role. Gate cameras cannot be assigned to weighbridge activity points.

A camera that cannot send the authentication header needs an integration adapter. Gate captures use this dedicated endpoint rather than the weighbridge callback.

The printer configuration is unchanged; optionally set `GATE_PASS_PRINTER_IP` to override the existing WB thermal printer address.

Example body:

```json
{
  "camera_id": "GATE_ENTRY_1",
  "snap_time": "2026-10-03T10:15:30+03:00",
  "reg_no": "T123ABC"
}
```

The existing Dahua-style `Picture.SnapInfo.DeviceID`, `Picture.SnapInfo.AccurateTime` and `Picture.Plate.PlateNumber` payload is also accepted. Use a timestamp with a timezone. Missing/empty plates are accepted so staff can correct failed recognition. Exact retries with the same camera and capture timestamp produce only one record. Distinct capture timestamps are distinct visits; configure the camera to report vehicle events rather than every video frame.

This stores vehicle event records, not continuous video. Camera image/video storage and physical gate control are not included.

## Manual creation

Click **Create gate pass**. Without active Gate Pass manual mode, the user is prompted to request it with a reason. A pending request must be approved before creation is allowed. Administrators use **Manual Mode → Gate Pass** (also linked from the Gate Passes page) to approve with an expiry, reject, extend, or end Gate Pass manual sessions.

With active approval, Create opens a truck-number form. The new record is marked Manual and starts Pending; staff then add driver/transporter details and obtain the normal ticket approval. The creating user and authorizing manual session are retained in the record and audit history.

Manual mode is scoped independently to `gate_pass` and `weighbridge`. An approval grants only the requested module for its approved time window. Multiple gate passes can be entered during that window, matching WB manual-mode behavior. Gate approval cannot authorize a WB capture, and WB approval cannot authorize a gate pass. Expired sessions cannot create records. Existing WB clients default to the `weighbridge` scope; Gate Pass requests explicitly send `scope: "gate_pass"`.

The Manual Mode menu contains **WB** and **Gate Pass** tabs, both managed by administrators. Each tab lists and acts on its own scope. Gate pass ticket approval remains available to admins/supervisors. An ended or expired session requires a new request.

## Thermal ticket

Printing sends an ESC/POS receipt over TCP port 9100, using the existing WB receipt contact heading, with GP ticket number, plate, driver/ID/contact, transporter/contact, capture time and approval details. Times on tickets use Tanzania time. The gate printer can be configured independently.

A successful response means the data was sent to the printer, not that paper output was confirmed. If the connection fails or the request is interrupted, inspect the printer before retrying to avoid accidental duplicate copies.

## Verification

`npm test` includes route tests for permissions, immutable decisions, stale edits, plate audit history, capture authentication and print eligibility. These use mocked database/printer dependencies. Validate with a real camera event and physical thermal print before production use.

`node test/gatePassDatabase.test.js` runs explicit PostgreSQL integration checks in an isolated schema and removes it afterward. It covers scope separation, expired approvals, concurrent requests, manual record provenance, dynamic camera roles/status/keys, and migration rollback.

Gate passes store master IDs and saved labels. Driver/transporter details are resolved on the server, not accepted as free-text overrides. Names on approved tickets remain unchanged when master records are later edited. Existing approved passes retain their saved details; pending passes created before the selection migration must select a driver before saving/approval. Buying center and notes are included on the thermal receipt.
