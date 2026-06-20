import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

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

  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [category, setCategory] = useState("Others");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [note, setNote] = useState("");

  async function save() {
    await client.models.Transaction.create({
      TransactionType: type,
      amount: Number(amount),
      payee,
      category,
      accountId,
      date,
      note,
    });

    onSaved();
  }

  return (
    <div>
      <h2>New Transaction</h2>

      <div>
        <button
          onClick={() => setType("EXPENSE")}
        >
          Expense
        </button>

        <button
          onClick={() => setType("INCOME")}
        >
          Income
        </button>

        <button
          onClick={() => setType("TRANSFER")}
        >
          Transfer
        </button>
      </div>

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
      />

      <input
        type="text"
        placeholder="Payee"
        value={payee}
        onChange={(e) =>
          setPayee(e.target.value)
        }
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) =>
          setCategory(e.target.value)
        }
      />

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
      />

      <textarea
        placeholder="Note"
        value={note}
        onChange={(e) =>
          setNote(e.target.value)
        }
      />

      <button onClick={save}>
        Save
      </button>
      <button onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}