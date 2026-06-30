/**
 * EditTransactionForm.tsx  —  SQLite / offline-first version
 *
 * Replaced: client.models.Transaction.update / .delete
 * With:     updateTransaction / deleteTransaction from db.ts
 */

import { useState } from "react";
import { updateTransaction, deleteTransaction, type Transaction, type TransactionType, type Category } from "../db";
import { categories } from "./constants/categories";

function InputRow({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
      <div className="text-sm font-medium text-gray-600 md:w-32 shrink-0">{label}</div>
      <div className="flex-1">
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}

interface Props {
  transaction: Transaction;
  onSaved: () => void;
  onCancel: () => void;
  onDeleted: () => void;
}

export default function EditTransactionForm({ transaction, onSaved, onCancel, onDeleted }: Props) {
  const [payee, setPayee] = useState(transaction.payee ?? "");
  const [amount, setAmount] = useState(transaction.amount ? String(transaction.amount) : "");
  const [type, setType] = useState<TransactionType>(transaction.TransactionType ?? "EXPENSE");
  const [category, setCategory] = useState<Category>((transaction.category as Category) ?? "OTHER");
  const [date, setDate] = useState(transaction.date ?? "");
  const [note, setNote] = useState(transaction.note ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; payee?: string }>({});

  function validate() {
    const newErrors: { amount?: string; payee?: string } = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      newErrors.amount = "Enter a valid amount greater than 0";
    }
    if (!payee.trim()) {
      newErrors.payee = "Payee is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleUpdate() {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateTransaction({
        id: transaction.id,
        TransactionType: type,
        amount: parseFloat(amount),
        payee: payee.trim(),
        category,
        date,
        note: note.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      console.error("Failed to update transaction:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="h-dvh bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-50 border-b">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white text-xl hover:bg-gray-900"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Edit Transaction</h2>
        <div className="w-10" />
      </div>

      {/* FORM */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="bg-white rounded-xl shadow-sm p-4">

          <InputRow label="Payee" error={errors.payee}>
            <input
              className={`w-full text-base px-3 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.payee ? "border-red-400" : "border-gray-200"}`}
              value={payee}
              onChange={(e) => {
                setPayee(e.target.value);
                if (errors.payee) setErrors((p) => ({ ...p, payee: undefined }));
              }}
            />
          </InputRow>

          <InputRow label="Amount" error={errors.amount}>
            <input
              className={`w-full text-base px-3 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.amount ? "border-red-400" : "border-gray-200"}`}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
              }}
            />
          </InputRow>

          <InputRow label="Type">
            <select
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </InputRow>

          <InputRow label="Category">
            <select
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </InputRow>

          <InputRow label="Date">
            <input
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </InputRow>

          <InputRow label="Note">
            <textarea
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </InputRow>
        </div>

        {/* SAVE */}
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="w-full mt-6 bg-blue-500 text-white py-4 rounded-xl text-base font-semibold active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* DELETE */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`w-full mt-3 mb-6 py-4 rounded-xl text-base font-semibold active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed ${
            confirmDelete ? "bg-red-500 text-white" : "bg-gray-100 text-red-500"
          }`}
        >
          {deleting ? "Deleting..." : confirmDelete ? "Tap again to confirm delete" : "Delete Transaction"}
        </button>
      </div>
    </div>
  );
}
