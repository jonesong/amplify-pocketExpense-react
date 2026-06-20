import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import NewTransactionForm from "./NewTransactionForm";

const client = generateClient<Schema>();

interface Props {
  account: Schema["Account"]["type"];
  onBack: () => void;
}

export default function TransactionPage({
  account,
  onBack,
}: Props) {
  const [showNewTransaction, setShowNewTransaction] = useState(false);

  const [transactions, setTransactions] = useState<
    Schema["Transaction"]["type"][]
  >([]);

  useEffect(() => {
    async function loadTransactions() {
      const { data, errors } =
        await client.models.Transaction.list({
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

    loadTransactions();
  }, [account.id]);

  async function loadTransactions() {
    const { data } = await client.models.Transaction.list({
      filter: {
        accountId: {
          eq: account.id,
        },
      },
    });

    setTransactions(data);
  }

  async function handleSaved() {
    setShowNewTransaction(false);
    await loadTransactions();
  }

  if (showNewTransaction) {
    return (
      <NewTransactionForm
        accountId={account.id}
        onSaved={handleSaved}
        onCancel={() => setShowNewTransaction(false)}
      />
    );
  }

  return (
    <div>
      <button onClick={onBack}>← Back</button>

      <h2>{account.name}</h2>

      <button
        onClick={() => setShowNewTransaction(true)}
      >
        Add Transaction
      </button>

      {transactions.map((t) => (
        <div key={t.id}>
          <div>{t.category}</div>
          <div>{t.payee}</div>
          <div>{t.amount}</div>
        </div>
      ))}
    </div>
  );
}