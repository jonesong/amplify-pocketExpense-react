import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { categories, type Category } from "../../src/constants/categories";

const client = generateClient<Schema>();

// ✅ MOVE OUTSIDE COMPONENT (IMPORTANT FIX)
function InputRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b gap-[120px]">
      <div className="text-sm text-gray-600 w-[160px]">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface Props {
  transaction: Schema["Transaction"]["type"];
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditTransactionForm({
  transaction,
  onSaved,
  onCancel,
}: Props) {
  const [payee, setPayee] = useState(transaction.payee ?? "");

  const [amount, setAmount] = useState(
    transaction.amount ? String(transaction.amount) : ""
  );

  const [type, setType] = useState(
    transaction.TransactionType ?? "EXPENSE"
  );

  const [category, setCategory] = useState<Category>(
    (transaction.category as Category) ?? "OTHER"
  );

  const [date, setDate] = useState(transaction.date ?? "");
  const [note, setNote] = useState(transaction.note ?? "");

  async function handleUpdate() {
    const { errors } = await client.models.Transaction.update({
      id: transaction.id,
      payee,
      amount: parseFloat(amount || "0"),
      TransactionType: type,
      category,
      date,
      note,
    });

    if (errors) {
      console.error(errors);
      return;
    }

    onSaved();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white text-xl hover:bg-gray-900"
        >
          ←
        </button>

        <h2 className="text-lg font-semibold">
          Edit Transaction
        </h2>

        <div className="w-10" />
      </div>

      {/* FORM */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">

          <InputRow label="Payee">
            <input
              className="w-full text-sm outline-none"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </InputRow>

          <InputRow label="Amount">
            <input
              className="w-full text-sm outline-none"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </InputRow>

          <InputRow label="Type">
            <select
              className="w-full text-sm outline-none bg-transparent"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "INCOME" | "EXPENSE")
              }
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </InputRow>

          <InputRow label="Category">
            <select
              className="w-full text-sm outline-none bg-transparent"
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

          <InputRow label="Date">
            <input
              className="w-full text-sm outline-none"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </InputRow>

          <InputRow label="Note">
            <textarea
              className="w-full text-sm outline-none resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </InputRow>
        </div>

        <button
          onClick={handleUpdate}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}