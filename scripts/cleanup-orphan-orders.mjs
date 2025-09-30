import Database from "better-sqlite3";

const db = new Database("data/app.db");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

function main(dryRun = false) {
  const orphanOrderIds = db
    .prepare(
      `
    SELECT o.id FROM orders o
    LEFT JOIN clients c ON c.id = o.client_id
    WHERE c.id IS NULL
  `,
    )
    .all()
    .map((r) => r.id);

  const report = {
    dryRun,
    orders: orphanOrderIds.length,
    orderChecklistItems: 0,
    orderNoteHistory: 0,
    deliverySlots: 0,
    installationSlots: 0,
    orderGoogleEvents: 0,
    installerPrivateTasks: 0,
    installerPrivateNotes: 0,
  };

  if (orphanOrderIds.length === 0) {
    console.log(JSON.stringify({ ok: true, ...report }));
    return;
  }

  const tx = db.transaction(() => {
    const listParam = orphanOrderIds;

    // Count dependents
    report.orderChecklistItems = db
      .prepare(
        `SELECT COUNT(1) as n FROM order_checklist_items WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.orderNoteHistory = db
      .prepare(
        `SELECT COUNT(1) as n FROM order_note_history WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.deliverySlots = db
      .prepare(
        `SELECT COUNT(1) as n FROM delivery_slots WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.installationSlots = db
      .prepare(
        `SELECT COUNT(1) as n FROM installation_slots WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.orderGoogleEvents = db
      .prepare(
        `SELECT COUNT(1) as n FROM order_google_events WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.installerPrivateTasks = db
      .prepare(
        `SELECT COUNT(1) as n FROM installer_private_tasks WHERE related_order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;
    report.installerPrivateNotes = db
      .prepare(
        `SELECT COUNT(1) as n FROM installer_private_notes WHERE related_order_id IN (${listParam.map(() => "?").join(",")})`,
      )
      .get(...listParam).n;

    if (dryRun) return;

    // Delete dependents first
    db.prepare(
      `DELETE FROM order_checklist_items WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM order_note_history WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM delivery_slots WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM installation_slots WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM order_google_events WHERE order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM installer_private_tasks WHERE related_order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
    db.prepare(
      `DELETE FROM installer_private_notes WHERE related_order_id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);

    // Finally delete the orders
    db.prepare(
      `DELETE FROM orders WHERE id IN (${listParam.map(() => "?").join(",")})`,
    ).run(...listParam);
  });

  tx();
  console.log(
    JSON.stringify({ ok: true, ...report, deletedOrderIds: orphanOrderIds }),
  );
}

const arg = process.argv[2];
const dry = arg === "--dry-run";
main(dry);
