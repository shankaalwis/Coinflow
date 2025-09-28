import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TransactionType = "CASH_IN" | "CASH_OUT";

type Cashbook = {
  id: string;
  name: string;
  balance: number;
  lastActivity: string;
};

type Transaction = {
  id: string;
  cashbookId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  mode: string;
  date: string;
};

type Category = {
  id: string;
  name: string;
};

type PaymentMode = {
  id: string;
  name: string;
};

type TransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  mode: string;
  date: string;
};

type TransactionUpdate = Partial<TransactionInput> & { cashbookId?: string };

type CashbookUpdate = {
  name?: string;
};

type PersistedState = {
  cashbooks: Cashbook[];
  transactions: Transaction[];
  categories: Category[];
  paymentModes: PaymentMode[];
};

type CashbookContextValue = {
  cashbooks: Cashbook[];
  transactions: Transaction[];
  categories: Category[];
  paymentModes: PaymentMode[];
  createCashbook: (name: string) => Cashbook;
  updateCashbook: (id: string, updates: CashbookUpdate) => void;
  deleteCashbook: (id: string) => void;
  getCashbookById: (id: string) => Cashbook | undefined;
  getTransactionsForCashbook: (cashbookId: string) => Transaction[];
  addTransaction: (cashbookId: string, input: TransactionInput) => void;
  updateTransaction: (id: string, updates: TransactionUpdate) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  addPaymentMode: (name: string) => void;
  removePaymentMode: (id: string) => void;
};

const STORAGE_KEY = "smartcash-ledger:data";

const isBrowser = typeof window !== "undefined";

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const calculateBalance = (cashbookId: string, items: Transaction[]) =>
  items
    .filter((item) => item.cashbookId === cashbookId)
    .reduce((total, item) => total + (item.type === "CASH_IN" ? item.amount : -item.amount), 0);

const getLatestActivity = (cashbookId: string, items: Transaction[]) => {
  const latest = items
    .filter((item) => item.cashbookId === cashbookId)
    .map((item) => item.date)
    .sort()
    .pop();

  return latest ?? new Date().toISOString();
};

const defaultState = (): PersistedState => {
  const transactions: Transaction[] = [
    {
      id: "t-1",
      cashbookId: "cb-1",
      type: "CASH_IN",
      amount: 4000.75,
      description: "Salary payment",
      category: "Salary",
      mode: "Bank Transfer",
      date: "2024-01-15T10:30:00Z",
    },
    {
      id: "t-2",
      cashbookId: "cb-1",
      type: "CASH_OUT",
      amount: 1200,
      description: "Rent payment",
      category: "Rent",
      mode: "Bank Transfer",
      date: "2024-01-02T09:00:00Z",
    },
    {
      id: "t-3",
      cashbookId: "cb-1",
      type: "CASH_OUT",
      amount: 350,
      description: "Weekly groceries",
      category: "Groceries",
      mode: "Card",
      date: "2024-01-12T16:45:00Z",
    },
    {
      id: "t-4",
      cashbookId: "cb-2",
      type: "CASH_IN",
      amount: 12500,
      description: "Consulting invoice",
      category: "Consulting",
      mode: "Bank Transfer",
      date: "2024-01-10T14:10:00Z",
    },
    {
      id: "t-5",
      cashbookId: "cb-2",
      type: "CASH_OUT",
      amount: 3580.5,
      description: "Office rent",
      category: "Rent",
      mode: "Bank Transfer",
      date: "2024-01-05T08:00:00Z",
    },
  ];

  const cashbooks: Cashbook[] = [
    {
      id: "cb-1",
      name: "Personal",
      balance: calculateBalance("cb-1", transactions),
      lastActivity: getLatestActivity("cb-1", transactions),
    },
    {
      id: "cb-2",
      name: "Business",
      balance: calculateBalance("cb-2", transactions),
      lastActivity: getLatestActivity("cb-2", transactions),
    },
  ];

  const categories: Category[] = [
    { id: "cat-1", name: "Salary" },
    { id: "cat-2", name: "Groceries" },
    { id: "cat-3", name: "Rent" },
    { id: "cat-4", name: "Utilities" },
    { id: "cat-5", name: "Consulting" },
  ];

  const paymentModes: PaymentMode[] = [
    { id: "mode-1", name: "Cash" },
    { id: "mode-2", name: "Bank Transfer" },
    { id: "mode-3", name: "Card" },
    { id: "mode-4", name: "Digital Wallet" },
  ];

  return { cashbooks, transactions, categories, paymentModes };
};

const loadPersistedState = (): PersistedState => {
  if (!isBrowser) {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw) as PersistedState;
    return {
      cashbooks: parsed.cashbooks ?? [],
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? [],
      paymentModes: parsed.paymentModes ?? [],
    };
  } catch (error) {
    console.error("Failed to read cashbook data from storage", error);
    return defaultState();
  }
};

const CashbookContext = createContext<CashbookContextValue | undefined>(undefined);

export const CashbookProvider = ({ children }: { children: ReactNode }) => {
  const initialState = useMemo(() => loadPersistedState(), []);

  const [cashbooks, setCashbooks] = useState<Cashbook[]>(initialState.cashbooks);
  const [transactions, setTransactions] = useState<Transaction[]>(initialState.transactions);
  const [categories, setCategories] = useState<Category[]>(initialState.categories);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(initialState.paymentModes);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const state: PersistedState = {
      cashbooks,
      transactions,
      categories,
      paymentModes,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [cashbooks, transactions, categories, paymentModes]);

  useEffect(() => {
    setCashbooks((prev) =>
      prev.map((cashbook) => ({
        ...cashbook,
        balance: calculateBalance(cashbook.id, transactions),
        lastActivity: getLatestActivity(cashbook.id, transactions),
      })),
    );
  }, [transactions]);

  const getCashbookById = useCallback(
    (id: string) => cashbooks.find((cashbook) => cashbook.id === id),
    [cashbooks],
  );

  const getTransactionsForCashbook = useCallback(
    (cashbookId: string) => transactions.filter((transaction) => transaction.cashbookId === cashbookId),
    [transactions],
  );

  const createCashbook = useCallback((name: string) => {
    const id = generateId();
    const now = new Date().toISOString();

    const newCashbook: Cashbook = {
      id,
      name,
      balance: 0,
      lastActivity: now,
    };

    setCashbooks((prev) => [...prev, newCashbook]);

    return newCashbook;
  }, []);

  const updateCashbook = useCallback((id: string, updates: CashbookUpdate) => {
    setCashbooks((prev) =>
      prev.map((cashbook) =>
        cashbook.id === id
          ? {
              ...cashbook,
              ...updates,
            }
          : cashbook,
      ),
    );
  }, []);

  const deleteCashbook = useCallback((id: string) => {
    setCashbooks((prev) => prev.filter((cashbook) => cashbook.id !== id));
    setTransactions((prev) => prev.filter((transaction) => transaction.cashbookId !== id));
  }, []);

  const addTransaction = useCallback((cashbookId: string, input: TransactionInput) => {
    setTransactions((prev) => {
      const id = generateId();
      const transaction: Transaction = {
        id,
        cashbookId,
        ...input,
      };

      return [...prev, transaction];
    });
  }, []);

  const updateTransaction = useCallback((id: string, updates: TransactionUpdate) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...updates,
              cashbookId: updates.cashbookId ?? transaction.cashbookId,
            }
          : transaction,
      ),
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
  }, []);

  const addCategory = useCallback((name: string) => {
    setCategories((prev) => {
      const exists = prev.some((category) => category.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return prev;
      }

      return [...prev, { id: generateId(), name }];
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const addPaymentMode = useCallback((name: string) => {
    setPaymentModes((prev) => {
      const exists = prev.some((mode) => mode.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return prev;
      }

      return [...prev, { id: generateId(), name }];
    });
  }, []);

  const removePaymentMode = useCallback((id: string) => {
    setPaymentModes((prev) => prev.filter((mode) => mode.id !== id));
  }, []);

  const value: CashbookContextValue = useMemo(
    () => ({
      cashbooks,
      transactions,
      categories,
      paymentModes,
      createCashbook,
      updateCashbook,
      deleteCashbook,
      getCashbookById,
      getTransactionsForCashbook,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      removeCategory,
      addPaymentMode,
      removePaymentMode,
    }),
    [
      cashbooks,
      transactions,
      categories,
      paymentModes,
      createCashbook,
      updateCashbook,
      deleteCashbook,
      getCashbookById,
      getTransactionsForCashbook,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      removeCategory,
      addPaymentMode,
      removePaymentMode,
    ],
  );

  return <CashbookContext.Provider value={value}>{children}</CashbookContext.Provider>;
};

export const useCashbookContext = () => {
  const context = useContext(CashbookContext);
  if (!context) {
    throw new Error("useCashbookContext must be used within a CashbookProvider");
  }

  return context;
};
