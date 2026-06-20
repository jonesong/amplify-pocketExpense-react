import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import TransactionPage from "./components/TransactionPage";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();

  const [accounts, setAccounts] = useState<
    Schema["Account"]["type"][]
  >([]);

  const [selectedAccount, setSelectedAccount] =
    useState<Schema["Account"]["type"] | null>(null);

  async function loadAccounts() {
    const { data, errors } = await client.models.Account.list();

    if (errors) {
      console.error(errors);
      return;
    }

    setAccounts(data);
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

        <button
          onClick={signOut}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          Sign out
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4">

        <h2 className="text-md font-semibold mb-4">
          Accounts
        </h2>

        {accounts.length === 0 ? (
          <p className="text-gray-500">
            No accounts found.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {account.name}
                  </div>

                  <div className="text-xs text-gray-500">
                    ID: {account.id}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedAccount(account)
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  View
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