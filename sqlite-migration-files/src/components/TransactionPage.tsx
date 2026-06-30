/**
 * TransactionPage.tsx  —  SQLite / offline-first version
 *
 * Replaced: client.models.Transaction.list({ filter: { accountId: { eq: ... } } })
 * With:     listTransactions(accountId) from db.ts
 */

import { useEffect, useState } from "react";
import { listTransactions, type Account, type Transaction } from "../db";
import NewTransactionForm from "./NewTransactionForm";
import EditTransactionForm from "./EditTransactionForm";
import { getCategoryMeta } from "./constants/categories";

interface Props {
  account: Account;
  onBack: () => void;
}

export default function TransactionPage({ account, onBack }: Props) {
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  async function load() {
    const data = await listTransactions(account.id);
    // sort oldest → newest so running balance accumulates correctly
    const sorted = [...data].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setTransactions(sorted);
  }

  useEffect(() => {
    load();
  }, [account.id]);

  async function handleSaved() {
    setShowNewTransaction(false);
    setEditingTransactionId(null);
    await load();
  }

  async function handleDeleted() {
    setEditingTransactionId(null);
    await load();
  }

  const finalBalance = transactions.reduce((sum, t) => {
    const amount = Number(t.amount);
    return t.TransactionType === "INCOME" ? sum + amount : sum - amount;
  }, 0);

  let runningBalance = 0;

  const formatAmount = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const editingTransaction = transactions.find((t) => t.id === editingTransactionId) ?? null;

  return (
    <div className="h-dvh bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white text-xl hover:bg-gray-900"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">{account.name}</h2>
        <button
          onClick={() => setShowNewTransaction(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white text-xl hover:bg-blue-600"
        >
          +
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">

        {/* START BALANCE */}
        <div className="flex justify-between px-4 py-3 bg-white rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-700">Start Balance</div>
          <div className="text-sm font-semibold text-gray-900">
            ₱{formatAmount(account.initialBalance ?? 0)}
          </div>
        </div>

        {/* EMPTY STATE */}
        {transactions.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-10">
            No transactions yet. Tap + to add one.
          </div>
        )}

        {/* TRANSACTIONS */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {transactions.map((t) => {
            const amount = Number(t.amount);
            const isIncome = t.TransactionType === "INCOME";
            runningBalance += isIncome ? amount : -amount;
            const meta = getCategoryMeta(t.category);

            return (
              <div
                key={t.id}
                onClick={() => setEditingTransactionId(t.id)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer active:scale-[0.99] transition"
              >
                {/* CATEGORY ICON */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg shrink-0 ${meta.bg}`}>
                  {meta.icon}
                </div>

                {/* LEFT */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {t.payee ?? "No Payee"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {meta.label} ·{" "}
                    {t.date
                      ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(t.date))
                      : ""}
                  </div>
                  {t.note ? (
                    <div className="text-xs text-gray-400 truncate mt-0.5">{t.note}</div>
                  ) : null}
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end shrink-0">
                  <div className={`text-sm font-semibold ${isIncome ? "text-green-600" : "text-red-500"}`}>
                    {isIncome ? "+" : "-"}₱{formatAmount(amount)}
                  </div>
                  <div className="text-xs text-gray-400">₱{formatAmount(runningBalance)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER BALANCE */}
      <div className="sticky bottom-0 flex justify-between items-center px-6 py-4 bg-white border-t z-10">
        <div className="text-sm text-gray-600 font-medium">Balance</div>
        <div className={`text-base font-bold ${finalBalance >= 0 ? "text-gray-900" : "text-red-500"}`}>
          ₱{formatAmount(finalBalance)}
        </div>
      </div>

      {/* NEW TRANSACTION MODAL */}
      {showNewTransaction && (
        <div className="fixed inset-0 z-50">
          <NewTransactionForm
            accountId={account.id}
            onSaved={handleSaved}
            onCancel={() => setShowNewTransaction(false)}
          />
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50" onClick={(e) => e.stopPropagation()}>
          <EditTransactionForm
            transaction={editingTransaction}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCancel={() => setEditingTransactionId(null)}
          />
        </div>
      )}
    </div>
  );
}
