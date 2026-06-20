import { type ClientSchema, a, defineData } from '@aws-amplify/backend'; 

const TransactionCategory = a.enum([
    "CASH",
    "CLOTHING",
    "FOOD",
    "GIFTS",
    "GROCERIES",
    "TRANSPORT",
    "SHOPPING",
    "BILLS",
    "ENTERTAINMENT",
    "HEALTH",
    "SALARY",
    "SAVINGS",
    "TRANSFER",
    "TRAVEL",
    "OTHER",
  ]);

const schema = a.schema({
  // 1. Account Model (e.g., Gcash, Bank, Cash)
  Account: a.model({
    name: a.string().required(),
    initialBalance: a.float().default(0),
    transactions: a.hasMany('Transaction', 'accountId'), // One-to-Many Relationship
  }).authorization((allow) => [allow.owner()]),

  // 2. Comprehensive Transaction Model matching your screenshot
  Transaction: a.model({
    TransactionType: a.enum([
      'EXPENSE',
      'INCOME',
      'TRANSFER',
    ]),
    amount: a.float().required(),
    payee: a.string(),
    category: TransactionCategory,
    accountId: a.string().required(), // Foreign key linking back to Account model
    account: a.belongsTo('Account', 'accountId'),
    date: a.string().required(), // YYYY-MM-DD
    note: a.string(), // "Add note" optional field
  }).authorization((allow) => [allow.owner()]),
  
});

export type Schema = ClientSchema<typeof schema>; 
export const data = defineData({ 
  schema,
  authorizationModes: {
    // This tells the data client in your app (generateClient())
    // to sign API requests with the user authentication token.
    defaultAuthorizationMode: 'userPool',
  },
 });
