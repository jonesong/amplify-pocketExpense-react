import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import NewTransactionForm from "./NewTransactionForm";

const client = generateClient<Schema>();

interface Props {
  account: Schema["Account"]["type"];
  onBack: () => void;
}

export default function TransactionPage({ account, onBack }: Props) {
  const [showNewTransaction, setShowNewTransaction] = useState(false);

  const [transactions, setTransactions] = useState<
    Schema["Transaction"]["type"][]
  >([]);

  async function loadTransactions() {
    const { data, errors } = await client.models.Transaction.list({
      filter: {
        accountId: {
          eq: account.id,
        },
      },
    });

    if (errors) {
      console.error(errors);
      return;
    }

    setTransactions(data);
  }

  useEffect(() => {
    loadTransactions();
  }, [account.id]);

  async function handleSaved() {
    setShowNewTransaction(false);
    await loadTransactions();
  }

  if (showNewTransaction) {
    return (
      <div className="p-4">
        <NewTransactionForm
          accountId={account.id}
          onSaved={handleSaved}
          onCancel={() => setShowNewTransaction(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <button
          onClick={() => setShowNewTransaction(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add
        </button>
      </div>

      {/* Account Title */}
      <h2 className="text-xl font-semibold mb-4">{account.name}</h2>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        {transactions.map((t) => {
          const isIncome = t.TransactionType === "INCOME";

          return (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              {/* LEFT SIDE */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-900">
                  {t.payee}
                </div>

                <div className="text-xs text-gray-500">
                  {t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString()
                    : ""}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col items-end">
                <div
                  className={`text-sm font-semibold ${
                    isIncome ? "text-green-600" : "text-gray-900"
                  }`}
                >
                  {isIncome ? "+" : "-"}₱{t.amount}
                </div>

                <div className="text-xs text-gray-400">
                  Balance
                </div>
              </div>
            </div>
          );
        })}
      </div>    
    </div>
  );
}