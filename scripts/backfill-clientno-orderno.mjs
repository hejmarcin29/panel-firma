import Database from 'better-sqlite3'

const db = new Database('data/app.db')
db.pragma('journal_mode = WAL')
db.pragma('busy_timeout = 5000')

const tx = db.transaction(() => {
  // Assign clientNo starting from 10 by created_at
  const clients = db.prepare('SELECT id FROM clients ORDER BY created_at ASC').all()
  let no = 10
  const updClient = db.prepare('UPDATE clients SET client_no=? WHERE id=?')
  for (const c of clients) {
    const cur = db.prepare('SELECT client_no FROM clients WHERE id=?').get(c.id)
    if (cur && cur.client_no != null) continue
    updClient.run(no, c.id)
    no += 1
  }

  // For each client, assign seq and order_no by created_at
  const getClientNo = db.prepare('SELECT client_no FROM clients WHERE id=?')
  const ordersByClient = db.prepare('SELECT id FROM orders WHERE client_id=? ORDER BY created_at ASC')
  const updOrder = db.prepare('UPDATE orders SET seq=?, order_no=? WHERE id=?')
  const clientIds = db.prepare('SELECT DISTINCT client_id as id FROM orders').all()
  for (const row of clientIds) {
    const cn = getClientNo.get(row.id)?.client_no
    let seq = 1
    const list = ordersByClient.all(row.id)
    for (const o of list) {
      const cur = db.prepare('SELECT seq, order_no FROM orders WHERE id=?').get(o.id)
      if (cur && cur.seq != null && cur.order_no) { seq = Math.max(seq, cur.seq + 1); continue }
      const orderNo = cn != null ? `${cn}_${seq}` : null
      updOrder.run(seq, orderNo, o.id)
      seq += 1
    }
  }
})

tx()
console.log('Backfill completed')
