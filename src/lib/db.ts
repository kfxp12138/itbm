import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'payments.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      test_type TEXT NOT NULL CHECK(test_type IN ('mbti', 'iq', 'career')),
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
      payment_method TEXT CHECK(payment_method IN ('wechat', 'alipay')),
      transaction_id TEXT,
      email TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      paid_at INTEGER,
      result_data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_test_type ON orders(test_type);
  `);
}

export interface Order {
  id: string;
  test_type: 'mbti' | 'iq' | 'career';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: 'wechat' | 'alipay';
  transaction_id?: string;
  email?: string;
  created_at: number;
  paid_at?: number;
  result_data?: string;
}

export function createOrder(params: {
  id: string;
  test_type: Order['test_type'];
  amount: number;
  email?: string;
  result_data?: string;
}): Order {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO orders (id, test_type, amount, email, result_data)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(params.id, params.test_type, params.amount, params.email || null, params.result_data || null);
  return getOrder(params.id)!;
}

export function getOrder(id: string): Order | null {
  const db = getDb();
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | null;
}

export function updateOrderStatus(
  id: string,
  status: Order['status'],
  extra?: { transactionId?: string; paymentMethod?: Order['payment_method'] }
): void {
  const db = getDb();
  const updates: string[] = ['status = ?'];
  const params: (string | number)[] = [status];

  if (status === 'paid') {
    updates.push('paid_at = unixepoch()');
  }
  if (extra?.transactionId) {
    updates.push('transaction_id = ?');
    params.push(extra.transactionId);
  }
  if (extra?.paymentMethod) {
    updates.push('payment_method = ?');
    params.push(extra.paymentMethod);
  }
  params.push(id);

  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
}

export function isOrderPaid(id: string): boolean {
  const order = getOrder(id);
  return order?.status === 'paid';
}
