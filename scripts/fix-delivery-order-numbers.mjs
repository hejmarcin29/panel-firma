import path from 'node:path';
import Database from 'better-sqlite3';

const databasePath = path.join(process.cwd(), 'data', 'panel.db');
const db = new Database(databasePath);

const deliveryOrdersStmt = db.prepare(`
  SELECT o.id AS id,
         o.order_number AS orderNumber,
         o.client_id AS clientId,
         o.updated_at AS updatedAt,
         c.client_number AS clientNumber
  FROM orders o
  JOIN clients c ON c.id = o.client_id
  WHERE o.execution_mode = 'DELIVERY_ONLY'
    AND o.order_number LIKE '%_D_%'
  ORDER BY o.created_at ASC
`);

const clientOrderNumbersStmt = db.prepare(`
  SELECT order_number AS orderNumber
  FROM orders
  WHERE client_id = ?
`);

const updateOrderNumberStmt = db.prepare(`
  UPDATE orders
     SET order_number = ?,
         updated_at = ?
   WHERE id = ?
`);

const deliveryOrders = deliveryOrdersStmt.all();

if (deliveryOrders.length === 0) {
  console.log('Brak zamówień dostawowych wymagających zmiany numeru.');
  process.exit(0);
}

const updates = [];

const transaction = db.transaction(() => {
  for (const order of deliveryOrders) {
    const clientOrders = clientOrderNumbersStmt.all(order.clientId);

    const usedSequences = new Set();

    for (const entry of clientOrders) {
      if (!entry.orderNumber) {
        continue;
      }

      const match = entry.orderNumber.match(/^[0-9]+_Z_(\d+)$/);
      if (!match) {
        continue;
      }

      const sequence = Number.parseInt(match[1] ?? '', 10);
      if (!Number.isNaN(sequence)) {
        usedSequences.add(sequence);
      }
    }

    let sequence = 1;
    while (usedSequences.has(sequence)) {
      sequence += 1;
    }

    const newOrderNumber = `${order.clientNumber}_Z_${sequence}`;

    if (newOrderNumber === order.orderNumber) {
      continue;
    }

    updateOrderNumberStmt.run(newOrderNumber, Date.now(), order.id);
    updates.push({ id: order.id, from: order.orderNumber, to: newOrderNumber });
  }
});

transaction();

db.close();

if (updates.length === 0) {
  console.log('Numery były już poprawne.');
} else {
  console.log('Zmieniono numery zleceń dla następujących rekordów:');
  for (const entry of updates) {
    console.log(`- ${entry.from} -> ${entry.to} (order_id=${entry.id})`);
  }
}
