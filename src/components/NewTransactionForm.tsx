import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { categories, type Category } from "../../src/constants/categories";

const client = generateClient<Schema>();

// ✅ MOVE OUTSIDE (fix focus/input bug)
function InputRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-4 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
      <div className="text-sm font-medium text-gray-600 md:w-32 shrink-0">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface Props {
  accountId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function NewTransactionForm({
  accountId,
  onSaved,
  onCancel,
}: Props) {
  const [type, setType] = useState<
    "EXPENSE" | "INCOME" | "TRANSFER"
  >("EXPENSE");

  // ✅ FIX: string amount (same fix as edit form)
  const [amount, setAmount] = useState("");

  const [payee, setPayee] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [note, setNote] = useState("");

  async function save() {
    await client.models.Transaction.create({
      TransactionType: type,
      amount: parseFloat(amount || "0"),
      payee,
      category,
      accountId,
      date,
      note,
    });

    onSaved();
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

        <h2 className="text-lg font-semibold">
          New Transaction
        </h2>

        <div className="w-10" />
      </div>

      {/* FORM */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="bg-white rounded-xl shadow-sm p-4">

          {/* TYPE */}
          <InputRow label="Type">
            <select
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | "INCOME"
                    | "EXPENSE"
                    | "TRANSFER"
                )
              }
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </InputRow>

          {/* AMOUNT (FIXED) */}
          <InputRow label="Amount">
            <input
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </InputRow>

          {/* PAYEE */}
          <InputRow label="Payee">
            <input
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </InputRow>

          {/* CATEGORY */}
          <InputRow label="Category">
            <select
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Category)
              }
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </InputRow>

          {/* DATE */}
          <InputRow label="Date">
            <input
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </InputRow>

          {/* NOTE */}
          <InputRow label="Note">
            <textarea
              className="w-full text-base px-3 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
            />
          </InputRow>
        </div>

        {/* ACTIONS */}
        <button
          onClick={save}
          className="w-full mt-6 mb-6 bg-blue-500 text-white py-4 rounded-xl text-base font-semibold active:scale-[0.99] transition"
        >
          Save Transaction
        </button>
      </div>
    </div>
  );
}