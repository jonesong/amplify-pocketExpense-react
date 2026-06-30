/**
 * db.ts  —  Local SQLite data layer
 *
 * Replaces all AWS Amplify `client.models.*` calls.
 * Uses @capacitor-community/sqlite so the same TypeScript runs
 * on Android (SQLite) and in the browser (IndexedDB fallback via jeepSQLite).
 *
 * Install deps:
 *   npm install @capacitor/core @capacitor-community/sqlite
 *   npx cap add android
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";

// ─── Types (mirrors your Amplify Schema) ───────────────────────────────────

export type TransactionType = "INCOME" | "EXPENSE";

export type Category =
  | "CASH" | "CLOTHING" | "FOOD" | "GIFTS" | "GROCERIES"
  | "TRANSPORT" | "SHOPPING" | "BILLS" | "ENTERTAINMENT"
  | "HEALTH" | "SALARY" | "SAVINGS" | "TRANSFER" | "TRAVEL" | "OTHER";

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  TransactionType: TransactionType;
  amount: number;
  payee: string;
  category: Category;
  accountId: string;
  date: string;          // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export type TransactionUI = Transaction & { accountName?: string };

// ─── Singleton connection ──────────────────────────────────────────────────

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;
const DB_NAME = "moneytracker";
const DB_VERSION = 1;

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS accounts (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    initialBalance REAL DEFAULT 0,
    createdAt     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    TransactionType TEXT NOT NULL,
    amount          REAL NOT NULL,
    payee           TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'OTHER',
    accountId       TEXT NOT NULL,
    date            TEXT NOT NULL,
    note            TEXT,
    createdAt       TEXT NOT NULL,
    FOREIGN KEY (accountId) REFERENCES accounts(id)
  );
`;

export async function initDB(): Promise<void> {
  if (db) return; // already open

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);
  }

  await db.open();
  await db.execute(CREATE_TABLES);
}

function getDB(): SQLiteDBConnection {
  if (!db) throw new Error("DB not initialised — call initDB() first");
  return db;
}

function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ─── Account CRUD ──────────────────────────────────────────────────────────

export async function listAccounts(): Promise<Account[]> {
  const res = await getDB().query("SELECT * FROM accounts ORDER BY createdAt ASC;");
  return (res.values ?? []) as Account[];
}

export async function createAccount(name: string, initialBalance = 0): Promise<Account> {
  const acc: Account = { id: uuid(), name, initialBalance, createdAt: now() };
  await getDB().run(
    "INSERT INTO accounts (id, name, initialBalance, createdAt) VALUES (?, ?, ?, ?);",
    [acc.id, acc.name, acc.initialBalance, acc.createdAt]
  );
  return acc;
}

export async function deleteAccount(accountId: string): Promise<void> {
  // Delete child transactions first (no cascade in SQLite by default)
  await getDB().run("DELETE FROM transactions WHERE accountId = ?;", [accountId]);
  await getDB().run("DELETE FROM accounts WHERE id = ?;", [accountId]);
}

// ─── Transaction CRUD ──────────────────────────────────────────────────────

export async function listTransactions(accountId?: string): Promise<Transaction[]> {
  let sql = "SELECT * FROM transactions";
  const params: string[] = [];

  if (accountId) {
    sql += " WHERE accountId = ?";
    params.push(accountId);
  }

  sql += " ORDER BY createdAt ASC;";
  const res = await getDB().query(sql, params);
  return (res.values ?? []) as Transaction[];
}

/** Returns all transactions enriched with accountName for dashboard/reports */
export async function listTransactionsWithAccount(): Promise<TransactionUI[]> {
  const sql = `
    SELECT t.*, a.name AS accountName
    FROM transactions t
    LEFT JOIN accounts a ON t.accountId = a.id
    ORDER BY t.date DESC, t.createdAt DESC;
  `;
  const res = await getDB().query(sql);
  return (res.values ?? []) as TransactionUI[];
}

export interface CreateTransactionInput {
  TransactionType: TransactionType;
  amount: number;
  payee: string;
  category: Category;
  accountId: string;
  date: string;
  note?: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const tx: Transaction = {
    id: uuid(),
    createdAt: now(),
    note: undefined,
    ...input,
  };

  await getDB().run(
    `INSERT INTO transactions
      (id, TransactionType, amount, payee, category, accountId, date, note, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [tx.id, tx.TransactionType, tx.amount, tx.payee, tx.category, tx.accountId, tx.date, tx.note ?? null, tx.createdAt]
  );

  return tx;
}

export interface UpdateTransactionInput {
  id: string;
  TransactionType: TransactionType;
  amount: number;
  payee: string;
  category: Category;
  date: string;
  note?: string;
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  await getDB().run(
    `UPDATE transactions
     SET TransactionType = ?, amount = ?, payee = ?, category = ?, date = ?, note = ?
     WHERE id = ?;`,
    [input.TransactionType, input.amount, input.payee, input.category, input.date, input.note ?? null, input.id]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  await getDB().run("DELETE FROM transactions WHERE id = ?;", [id]);
}
