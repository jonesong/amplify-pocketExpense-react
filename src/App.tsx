import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

function App() {
  const [accounts, setAccounts] = useState<Schema["Account"]["type"][]>([]);
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuthenticator();

  async function loadAccounts() {
    const { data, errors } = await client.models.Account.list();

    if (errors) {
      console.error(errors);
      return;
    }

    setAccounts(data);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!accountName.trim()) return;

    setLoading(true);

    const { errors } = await client.models.Account.create({
      name: accountName.trim(),
    });

    setLoading(false);

    if (errors) {
      console.error(errors);
      return;
    }

    setAccountName("");
    await loadAccounts();
  }

  useEffect(() => {
    loadAccounts();

    const sub = client.models.Account.observeQuery().subscribe({
      next: ({ items }) => {
        setAccounts(items);
      },
    });

    return () => sub.unsubscribe();
  }, []);

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <button onClick={signOut}>Sign out</button>
      <form
        onSubmit={createAccount}
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <input
          type="text"
          placeholder="Account name (e.g. GCash)"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          style={{
            flex: 1,
            padding: "0.75rem",
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Add Account"}
        </button>
      </form>

      <div>
        <h2>Accounts</h2>

        {accounts.length === 0 ? (
          <p>No accounts created yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1rem",
                }}
              >
                <h3>{account.name}</h3>

                <p>
                  Account ID:
                  <br />
                  <small>{account.id}</small>
                </p>

                <button>
                  View Transactions
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;