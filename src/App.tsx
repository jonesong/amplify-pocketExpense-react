import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import TransactionPage from "./components/TransactionPage";
import NewTransactionForm from "./components/NewTransactionForm";

const client = generateClient<Schema>();

// =======================
// DATE HELPERS
// =======================
function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function buildWeek(transactions: Schema["Transaction"]["type"][]) {
  const start = getStartOfWeek();
  const week = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);

    const key = formatDateKey(day);
    const daily = transactions.filter((t) => t.date === key);

    const total = daily.reduce((sum, t) => {
      const amt = Number(t.amount);
      return t.TransactionType === "INCOME"
        ? sum + amt
        : sum - amt;
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

// =======================

function App() {
  const { user, signOut } = useAuthenticator();

  const [accounts, setAccounts] = useState<Schema["Account"]["type"][]>([]);
  const [transactions, setTransactions] = useState<
    Schema["Transaction"]["type"][]
  >([]);

  const [selectedAccount, setSelectedAccount] =
    useState<Schema["Account"]["type"] | null>(null);

  const [view, setView] = useState<"calendar" | "dashboard">("calendar");
  const [menuOpen, setMenuOpen] = useState(false);

  // NEW: transaction modal
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [selectedAccountForTx, setSelectedAccountForTx] =
    useState<Schema["Account"]["type"] | null>(null);

  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);

  // =======================
  async function loadAccounts() {
    const { data } = await client.models.Account.list();
    setAccounts(data);
  }

  async function loadTransactions() {
    const { data } = await client.models.Transaction.list();
    setTransactions(data);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!accountName.trim()) return;

    setLoading(true);

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

    const sub = client.models.Account.observeQuery().subscribe({
      next: ({ items }) => setAccounts(items),
    });

    const txSub = client.models.Transaction.observeQuery().subscribe({
      next: ({ items }) => setTransactions(items),
    });

    return () => {
      sub.unsubscribe();
      txSub.unsubscribe();
    };
  }, []);

  const week = buildWeek(transactions);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <h1 className="text-lg font-semibold">
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
              <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-lg w-44 z-50 overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 !text-black dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setView("calendar");
                    setMenuOpen(false);
                  }}
                >
                  📅 Calendar
                </button>

                <button
                  className="w-full text-left px-4 py-3 !text-black dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setView("dashboard");
                    setMenuOpen(false);
                  }}
                >
                  📊 Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= CALENDAR ================= */}
      {view === "calendar" && (
        <div className="p-4 relative">

          <h2 className="text-sm font-semibold mb-2">This Week</h2>

          <div className="flex gap-2 overflow-x-auto">
            {week.map((d) => (
              <div
                key={d.date}
                className="min-w-[70px] bg-white rounded-lg shadow p-2 text-center"
              >
                <div className="text-xs text-gray-500">{d.label}</div>
                <div className="font-semibold">{d.day}</div>
                <div className={`text-xs mt-1 ${
                  d.total >= 0 ? "text-green-600" : "text-red-500"
                }`}>
                  ₱{Math.abs(d.total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* FLOATING + BUTTON */}
          <button
            onClick={() => setShowNewTransaction(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full text-2xl shadow-lg"
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
              className="p-4 bg-white rounded-lg shadow flex justify-between"
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

      {/* ================= NEW TRANSACTION ================= */}
      {showNewTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-4">

            <h2 className="font-semibold mb-3">
              Select Account
            </h2>

            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccountForTx(acc);
                  setShowNewTransaction(false); // CLOSE MODAL HERE
                }}
                className="w-full text-left p-3 border rounded mb-2 bg-gray-300 hover:bg-gray-500"
              >
                {acc.name}
              </button>
            ))}

            <button
              onClick={() => setShowNewTransaction(false)}
              className="w-full mt-2 text-sm text-gray-500 bg-gray-300 hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION FORM AFTER ACCOUNT PICK */}
      {selectedAccountForTx && (
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
      )}
    </div>
  );
}

export default App;