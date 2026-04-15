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
      payment_provider TEXT CHECK(payment_provider IN ('zpay', 'wechat_jsapi', 'wechat_native')),
      transaction_id TEXT,
      email TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      paid_at INTEGER,
      result_data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_test_type ON orders(test_type);
  `);

  ensureOrdersColumn(db, 'payment_method', "ALTER TABLE orders ADD COLUMN payment_method TEXT CHECK(payment_method IN ('wechat', 'alipay'))");
  ensureOrdersColumn(db, 'payment_provider', "ALTER TABLE orders ADD COLUMN payment_provider TEXT CHECK(payment_provider IN ('zpay', 'wechat_jsapi', 'wechat_native'))");
}

function ensureOrdersColumn(db: Database.Database, columnName: string, alterSql: string) {
  const columns = db.prepare("PRAGMA table_info('orders')").all() as Array<{ name?: string }>;
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(alterSql);
  }
}

export interface Order {
  id: string;
  test_type: 'mbti' | 'iq' | 'career';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: 'wechat' | 'alipay';
  payment_provider?: 'zpay' | 'wechat_jsapi' | 'wechat_native';
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
  payment_method?: Order['payment_method'];
  payment_provider?: Order['payment_provider'];
  result_data?: string;
}): Order {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO orders (id, test_type, amount, payment_method, payment_provider, email, result_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    params.id,
    params.test_type,
    params.amount,
    params.payment_method || null,
    params.payment_provider || null,
    params.email || null,
    params.result_data || null
  );
  return getOrder(params.id)!;
}

export function getOrder(id: string): Order | null {
  const db = getDb();
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | null;
}

export function updateOrderStatus(
  id: string,
  status: Order['status'],
  extra?: { transactionId?: string; paymentMethod?: Order['payment_method']; paymentProvider?: Order['payment_provider'] }
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
  if (extra?.paymentProvider) {
    updates.push('payment_provider = ?');
    params.push(extra.paymentProvider);
  }
  params.push(id);

  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
}

export function markOrderPaidIfPending(
  id: string,
  extra?: { transactionId?: string; paymentMethod?: Order['payment_method']; paymentProvider?: Order['payment_provider'] }
): boolean {
  const db = getDb();
  const updates: string[] = ['status = ?', 'paid_at = unixepoch()'];
  const params: (string | number)[] = ['paid'];

  if (extra?.transactionId) {
    updates.push('transaction_id = ?');
    params.push(extra.transactionId);
  }

  if (extra?.paymentMethod) {
    updates.push('payment_method = ?');
    params.push(extra.paymentMethod);
  }

  if (extra?.paymentProvider) {
    updates.push('payment_provider = ?');
    params.push(extra.paymentProvider);
  }

  params.push(id, 'pending');

  const result = db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ? AND status = ?`).run(...params);
  return result.changes > 0;
}

export function isOrderPaid(id: string): boolean {
  const order = getOrder(id);
  return order?.status === 'paid';
}
