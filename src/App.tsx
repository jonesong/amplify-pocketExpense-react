import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import TransactionPage from "./components/TransactionPage";
import NewTransactionForm from "./components/NewTransactionForm";
import EditTransactionForm from "./components/EditTransactionForm";
import { getCategoryMeta } from "./constants/categories";

const client = generateClient<Schema>();

// =======================
// DATE HELPERS
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

function buildWeek(
  transactions: Schema["Transaction"]["type"][],
  weekOffset: number
) {
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

    week.push({
      label: formatDay(day),
      date: key,
      day: day.getDate(),
      total,
    });
  }

  return week;
}

type TransactionUI = Schema["Transaction"]["type"] & {
  accountName?: string;
};

// =======================
function App() {
  const { user, signOut } = useAuthenticator();

  const [weekOffset, setWeekOffset] = useState(0);
  const [accounts, setAccounts] = useState<Schema["Account"]["type"][]>([]);
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<Schema["Account"]["type"] | null>(null);
  const [view, setView] = useState<"calendar" | "dashboard">("calendar");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [selectedAccountForTx, setSelectedAccountForTx] =
    useState<Schema["Account"]["type"] | null>(null);
  const [accountName, setAccountName] = useState("");
  const [, setLoading] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // =======================
  async function loadAccounts() {
    // Amplify owner auth automatically filters to the signed-in user's records
    const { data } = await client.models.Account.list();
    setAccounts(data);
  }

  async function loadTransactions() {
    // Both lists are already scoped to the current owner by Amplify
    const [{ data: tx }, { data: acc }] = await Promise.all([
      client.models.Transaction.list(),
      client.models.Account.list(),
    ]);

    const accMap = new Map(acc.map((a) => [a.id, a.name]));

    const enriched = tx.map((t) => ({
      ...t,
      accountName: accMap.get(t.accountId) ?? "Account",
    }));

    setTransactions(enriched);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) return;
    setLoading(true);
    // owner is set automatically by Amplify from the authenticated user
    await client.models.Account.create({
      name: accountName.trim(),
    });
    setLoading(false);
    setAccountName("");
    await loadAccounts();
  }

  useEffect(() => {
    loadAccounts();
    loadTransactions();

    // observeQuery is already scoped to the current owner via allow.owner()
    const sub = client.models.Account.observeQuery().subscribe({
      next: ({ items }) => setAccounts(items),
    });

    const txSub = client.models.Transaction.observeQuery().subscribe({
      next: async () => {
        await loadTransactions();
      },
    });

    return () => {
      sub.unsubscribe();
      txSub.unsubscribe();
    };
  }, []);

  const week = buildWeek(transactions, weekOffset);
  const weekDates = new Set(week.map((d) => d.date));
  const weekTransactions = transactions
    .filter((t) => weekDates.has(t.date))
    .sort((a, b) => {
      // Primary: date descending (latest day first)
      if (b.date > a.date) return 1;
      if (b.date < a.date) return -1;
      // Secondary: createdAt descending (latest entry first within same day)
      return (
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
      );
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

      {/* HEADER */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-base font-semibold truncate max-w-[60%]">
          {user?.signInDetails?.loginId}'s Money Tracker
        </h1>

        <div className="flex gap-2">
          <button
            onClick={signOut}
            className="px-3 py-1 bg-gray-800 text-white rounded-lg"
          >
            Sign out
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 bg-orange-400 rounded-lg hover:bg-orange-500"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-lg w-44 z-50">
                <button
                  className="w-full text-left px-4 py-3 !text-black hover:bg-gray-100"
                  onClick={() => { setView("calendar"); setMenuOpen(false); }}
                >
                  📅 Calendar
                </button>
                <button
                  className="w-full text-left px-4 py-3 !text-black hover:bg-gray-100"
                  onClick={() => { setView("dashboard"); setMenuOpen(false); }}
                >
                  📊 Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ================= CALENDAR ================= */}
        {view === "calendar" && (
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">This Week</h2>

            <div className="flex items-center justify-between mb-1 text-xs">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="px-2 py-0.5 bg-gray-200 rounded text-[10px]"
              >
                ◀ Prev
              </button>
              <div className="text-sm font-semibold">
                Week {weekOffset === 0 ? "(This Week)" : weekOffset}
              </div>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="px-2 py-0.5 bg-gray-200 rounded text-[10px]"
              >
                Next ▶
              </button>
            </div>

            {/* WEEK ROW */}
            <div className="grid grid-cols-7 bg-white rounded-lg shadow overflow-hidden">
              {week.map((d) => (
                <div
                  key={d.date}
                  className={`text-center py-1 border-r last:border-r-0 ${
                    d.date === today ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="text-[10px] text-gray-500">{d.label}</div>
                  <div
                    className={`text-xs font-semibold ${
                      d.date === today ? "text-blue-600" : ""
                    }`}
                  >
                    {d.day}
                  </div>
                  <div
                    className={`text-[9px] truncate px-1 ${
                      d.total >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    ₱{Math.abs(d.total).toFixed(0)}
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
                <div className="text-xs text-gray-400">
                  No transactions this week
                </div>
              ) : (
                weekTransactions.map((t) => {
                  const meta = getCategoryMeta(t.category);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setEditingTransactionId(t.id)}
                      className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm active:scale-[0.99] transition cursor-pointer"
                    >
                      {/* CATEGORY ICON */}
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-lg shrink-0 ${meta.bg}`}
                      >
                        {meta.icon}
                      </div>

                      {/* LEFT */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {t.payee ?? "No Payee"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.accountName ?? "Account"} · {meta.label}
                        </div>
                      </div>

                      {/* RIGHT AMOUNT */}
                      <div className="flex flex-col">
                        <div className={`text-sm font-semibold ${t.TransactionType === "INCOME"
                            ? "text-green-600"
                            : "text-red-500"
                          }`}
                        >
                          {t.TransactionType === "INCOME" ? "+" : "-"}₱
                          {Number(t.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 text-right">
                          {t.date.slice(5)}
                        </div>
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
            <form onSubmit={createAccount} className="flex gap-3 mb-6">
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="flex-1 p-3 border rounded-lg"
                placeholder="Account name"
              />
              <button className="bg-blue-500 text-white px-4 rounded">
                Add
              </button>
            </form>

            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-white rounded-xl shadow-sm flex justify-between items-center active:scale-[0.99] transition mb-3"
              >
                <div>{acc.name}</div>
                <button
                  onClick={() => setSelectedAccount(acc)}
                  className="bg-blue-500 text-white px-4 py-1 rounded"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= SELECT ACCOUNT MODAL ================= */}
      {showNewTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-4">
            <h2 className="font-semibold mb-3">Select Account</h2>

            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">
                No accounts yet. Create one in the Dashboard first.
              </p>
            ) : (
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountForTx(acc);
                    setShowNewTransaction(false);
                  }}
                  className="w-full text-left p-3 border rounded mb-2 bg-gray-100 hover:bg-gray-200"
                >
                  {acc.name}
                </button>
              ))
            )}

            <button
              onClick={() => setShowNewTransaction(false)}
              className="w-full mt-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 py-2 rounded"
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
        const editingTransaction = transactions.find(
          (t) => t.id === editingTransactionId
        );
        if (!editingTransaction) return null;
        return (
          <div className="fixed inset-0 z-50">
            <EditTransactionForm
              transaction={editingTransaction}
              onSaved={() => {
                setEditingTransactionId(null);
                loadTransactions();
              }}
              onDeleted={() => {
                setEditingTransactionId(null);
                loadTransactions();
              }}
              onCancel={() => setEditingTransactionId(null)}
            />
          </div>
        );
      })()}
    </div>
  );
}

export default App;
