import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";

type TransactionType = "CASH_IN" | "CASH_OUT";

type Cashbook = {
  id: string;
  name: string;
  balance: number;
  lastActivity: string | null;
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

const STORAGE_KEY_PREFIX = "coinflow:data";

const isBrowser = typeof window !== "undefined";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Salary" },
  { id: "cat-2", name: "Groceries" },
  { id: "cat-3", name: "Rent" },
  { id: "cat-4", name: "Utilities" },
  { id: "cat-5", name: "Consulting" },
];

const DEFAULT_PAYMENT_MODES: PaymentMode[] = [
  { id: "mode-1", name: "Cash" },
  { id: "mode-2", name: "Bank Transfer" },
  { id: "mode-3", name: "Card" },
  { id: "mode-4", name: "Digital Wallet" },
];

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

  return latest ?? null;
};

const cloneCategories = (categories: Category[]) => categories.map((category) => ({ ...category }));
const clonePaymentModes = (modes: PaymentMode[]) => modes.map((mode) => ({ ...mode }));

const buildDefaultState = (): PersistedState => ({
  cashbooks: [],
  transactions: [],
  categories: cloneCategories(DEFAULT_CATEGORIES),
  paymentModes: clonePaymentModes(DEFAULT_PAYMENT_MODES),
});

const loadPersistedState = (key: string): PersistedState => {
  if (!isBrowser) {
    return buildDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return buildDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      cashbooks: parsed.cashbooks ?? [],
      transactions: parsed.transactions ?? [],
      categories: parsed.categories?.length ? parsed.categories : cloneCategories(DEFAULT_CATEGORIES),
      paymentModes: parsed.paymentModes?.length ? parsed.paymentModes : clonePaymentModes(DEFAULT_PAYMENT_MODES),
    };
  } catch (error) {
    console.error("Failed to read cashbook data from storage", error);
    return buildDefaultState();
  }
};

const recalcCashbooks = (cashbooks: Cashbook[], transactions: Transaction[]): Cashbook[] =>
  cashbooks.map((cashbook) => ({
    ...cashbook,
    balance: calculateBalance(cashbook.id, transactions),
    lastActivity: getLatestActivity(cashbook.id, transactions) ?? cashbook.lastActivity ?? null,
  }));

const CashbookContext = createContext<CashbookContextValue | undefined>(undefined);

export const CashbookProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}:${user?.id ?? "anonymous"}`,
    [user?.id],
  );

  const [cashbooks, setCashbooks] = useState<Cashbook[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(cloneCategories(DEFAULT_CATEGORIES));
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(clonePaymentModes(DEFAULT_PAYMENT_MODES));
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    const state = loadPersistedState(storageKey);
    setCashbooks(recalcCashbooks(state.cashbooks, state.transactions));
    setTransactions(state.transactions);
    setCategories(cloneCategories(state.categories));
    setPaymentModes(clonePaymentModes(state.paymentModes));
    setHydratedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!isBrowser || hydratedKey !== storageKey) {
      return;
    }

    const state: PersistedState = {
      cashbooks,
      transactions,
      categories,
      paymentModes,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [cashbooks, transactions, categories, paymentModes, storageKey, hydratedKey]);

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
    setTransactions((prevTransactions) => {
      const updatedTransactions = prevTransactions.filter((transaction) => transaction.cashbookId !== id);
      setCashbooks((prevCashbooks) =>
        recalcCashbooks(
          prevCashbooks.filter((cashbook) => cashbook.id !== id),
          updatedTransactions,
        ),
      );
      return updatedTransactions;
    });
  }, []);

  const addTransaction = useCallback((cashbookId: string, input: TransactionInput) => {
    setTransactions((prev) => {
      const id = generateId();
      const transaction: Transaction = {
        id,
        cashbookId,
        ...input,
      };

      const updatedTransactions = [...prev, transaction];
      setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
      return updatedTransactions;
    });
  }, []);

  const updateTransaction = useCallback((id: string, updates: TransactionUpdate) => {
    setTransactions((prev) => {
      const updatedTransactions = prev.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...updates,
              cashbookId: updates.cashbookId ?? transaction.cashbookId,
            }
          : transaction,
      );

      setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
      return updatedTransactions;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const updatedTransactions = prev.filter((transaction) => transaction.id !== id);
      setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
      return updatedTransactions;
    });
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

