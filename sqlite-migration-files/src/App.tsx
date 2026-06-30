/**
 * App.tsx  —  SQLite / offline-first version
 *
 * All `client.models.*` calls have been replaced with db.ts functions.
 * AWS Amplify, Cognito auth, and observeQuery subscriptions are removed.
 */

import { useEffect, useState } from "react";
import TransactionPage from "./components/TransactionPage";
import NewTransactionForm from "./components/NewTransactionForm";
import EditTransactionForm from "./components/EditTransactionForm";
import ReportPage from "./components/ReportPage";
import { getCategoryMeta } from "./constants/categories";
import {
  listAccounts,
  listTransactionsWithAccount,
  createAccount,
  deleteAccount,
  type Account,
  type TransactionUI,
} from "./db";

// =======================
// DATE HELPERS  (unchanged)
// =======================
function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildWeek(transactions: TransactionUI[], weekOffset: number) {
  const start = getStartOfWeek();
  start.setDate(start.getDate() + weekOffset * 7);

  const week = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);

    const key = formatDateKey(day);
    const daily = transactions.filter((t) => t.date === key);

    const total = daily.reduce((sum, t) => {
      const amt = Number(t.amount);
      return t.TransactionType === "INCOME" ? sum + amt : sum - amt;
    }, 0);

    week.push({ label: formatDay(day), date: key, day: day.getDate(), total });
  }

  return week;
}

// =======================
function App() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [view, setView] = useState<"calendar" | "dashboard" | "report">("calendar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [selectedAccountForTx, setSelectedAccountForTx] = useState<Account | null>(null);
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);

  // =======================
  async function loadAccounts() {
    const data = await listAccounts();
    setAccounts(data);
  }

  async function loadTransactions() {
    const data = await listTransactionsWithAccount();
    setTransactions(data);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return;
    setLoading(true);
    await createAccount(accountName.trim());
    setLoading(false);
    setAccountName("");
    await loadAccounts();
  }

  async function handleDeleteAccount(accountId: string) {
    await deleteAccount(accountId);  // also deletes child transactions
    setConfirmDeleteAccountId(null);
    await loadAccounts();
    await loadTransactions();
  }

  useEffect(() => {
    loadAccounts();
    loadTransactions();
    // No real-time subscriptions needed — data is local
  }, []);

  const week = buildWeek(transactions, weekOffset);
  const weekDates = new Set(week.map((d) => d.date));
  const weekTransactions = transactions
    .filter((t) => weekDates.has(t.date))
    .sort((a, b) => {
      if (b.date > a.date) return 1;
      if (b.date < a.date) return -1;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

  // =======================
  // TRANSACTION PAGE
  // =======================
  if (selectedAccount) {
    return (
      <TransactionPage
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
      />
    );
  }

  const today = formatDateKey(new Date());

  return (
    <div className="h-dvh bg-gray-50 flex flex-col">

      {/* ======================== HEADER ======================== */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">

          {/* LEFT: Logo + branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-lg font-bold leading-none">$</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                Money Tracker
              </span>
              <span className="text-sm font-bold text-gray-800">Local</span>
            </div>
          </div>

          {/* RIGHT: hamburger menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                <button
                  onClick={() => { setView("calendar"); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  📅 Calendar
                </button>
                <button
                  onClick={() => { setView("dashboard"); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  🏦 Accounts
                </button>
                <button
                  onClick={() => { setView("report"); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  📊 Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NAV TABS */}
        <div className="flex border-t">
          {(["calendar", "dashboard", "report"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 py-2 text-xs font-semibold transition ${
                view === tab
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-400"
              }`}
            >
              {tab === "calendar" ? "📅 Calendar" : tab === "dashboard" ? "🏦 Accounts" : "📊 Report"}
            </button>
          ))}
        </div>
      </div>

      {/* ======================== CONTENT ======================== */}
      <div className="flex-1 overflow-y-auto">

        {/* ================= CALENDAR ================= */}
        {view === "calendar" && (
          <div className="p-4">

            {/* WEEK NAVIGATOR */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-gray-700">
                {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} weeks ago`}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 0}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-30"
              >
                ›
              </button>
            </div>

            {/* WEEK GRID */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {week.map((d) => (
                <div
                  key={d.date}
                  className={`flex flex-col items-center py-2 rounded-xl text-center transition ${
                    d.date === today
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <div className="text-[9px] font-semibold opacity-70">{d.label}</div>
                  <div className={`text-sm font-bold ${d.date === today ? "text-white" : "text-gray-900"}`}>
                    {d.day}
                  </div>
                  <div className={`text-[9px] truncate px-1 ${d.total >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ${Math.abs(d.total).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            {/* WEEK TRANSACTIONS */}
            <div className="mt-4 space-y-3 px-1">
              <div className="text-xs font-semibold text-gray-500">
                This Week's Transactions
              </div>

              {weekTransactions.length === 0 ? (
                <div className="text-xs text-gray-400">No transactions this week</div>
              ) : (
                weekTransactions.map((t) => {
                  const meta = getCategoryMeta(t.category);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setEditingTransactionId(t.id)}
                      className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm active:scale-[0.99] transition cursor-pointer"
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg shrink-0 ${meta.bg}`}>
                        {meta.icon}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.payee ?? "No Payee"}</div>
                        <div className="text-xs text-gray-500">
                          {t.accountName ?? "Account"} · {meta.label}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`text-sm font-semibold ${t.TransactionType === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                          {t.TransactionType === "INCOME" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">{t.date.slice(5)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ADD TRANSACTION BUTTON */}
            <button
              onClick={() => setShowNewTransaction(true)}
              className="mt-4 w-14 h-14 bg-blue-500 text-white rounded-full text-2xl shadow-lg active:scale-95 transition z-40"
            >
              +
            </button>
          </div>
        )}

        {/* ================= DASHBOARD ================= */}
        {view === "dashboard" && (
          <div className="p-4">
            <form onSubmit={handleCreateAccount} className="flex gap-3 mb-6">
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="flex-1 p-3 border rounded-lg"
                placeholder="Account name (e.g. GCash, Cash)"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 rounded disabled:opacity-50"
              >
                Add
              </button>
            </form>

            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-white rounded-xl shadow-sm flex justify-between items-center active:scale-[0.99] transition mb-3"
              >
                <div className="font-medium">{acc.name}</div>
                <div className="flex gap-2">
                  {confirmDeleteAccountId === acc.id ? (
                    <>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAccountId(null)}
                        className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedAccount(acc)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAccountId(acc.id)}
                        className="bg-gray-100 text-red-500 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= REPORT ================= */}
        {view === "report" && (
          <ReportPage
            transactions={transactions}
            accounts={accounts}
            onBack={() => setView("calendar")}
          />
        )}
      </div>

      {/* ================= SELECT ACCOUNT MODAL ================= */}
      {showNewTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-4">
            <h2 className="font-semibold mb-3">Select Account</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">
                No accounts yet. Create one in Accounts first.
              </p>
            ) : (
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountForTx(acc);
                    setShowNewTransaction(false);
                  }}
                  className="w-full text-left p-3 border rounded mb-2 !text-blue-500 bg-gray-100 hover:bg-gray-200"
                >
                  {acc.name}
                </button>
              ))
            )}
            <button
              onClick={() => setShowNewTransaction(false)}
              className="w-full mt-2 text-sm !text-red-500 bg-gray-100 hover:bg-gray-200 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION FORM AFTER ACCOUNT PICK */}
      {selectedAccountForTx && (
        <div className="fixed inset-0 z-50">
          <NewTransactionForm
            accountId={selectedAccountForTx.id}
            onCancel={() => {
              setSelectedAccountForTx(null);
              setShowNewTransaction(false);
            }}
            onSaved={() => {
              setSelectedAccountForTx(null);
              setShowNewTransaction(false);
              loadTransactions();
            }}
          />
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      {editingTransactionId && (() => {
        const editingTransaction = transactions.find((t) => t.id === editingTransactionId);
        if (!editingTransaction) return null;
        return (
          <div className="fixed inset-0 z-50">
            <EditTransactionForm
              transaction={editingTransaction}
              onSaved={() => { setEditingTransactionId(null); loadTransactions(); }}
              onDeleted={() => { setEditingTransactionId(null); loadTransactions(); }}
              onCancel={() => setEditingTransactionId(null)}
            />
          </div>
        );
      })()}
    </div>
  );
}

export default App;
