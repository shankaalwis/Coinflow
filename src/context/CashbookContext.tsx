import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CURRENCY } from "@/constants/currencies";

type TransactionType = "CASH_IN" | "CASH_OUT";

type Cashbook = {
  id: string;
  name: string;
  currency: string;
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
  currency?: string;
};

type CashbookContextValue = {
  cashbooks: Cashbook[];
  transactions: Transaction[];
  categories: Category[];
  paymentModes: PaymentMode[];
  createCashbook: (name: string, currency: string) => Promise<Cashbook>;
  updateCashbook: (id: string, updates: CashbookUpdate) => Promise<void>;
  deleteCashbook: (id: string) => Promise<void>;
  getCashbookById: (id: string) => Cashbook | undefined;
  getTransactionsForCashbook: (cashbookId: string) => Transaction[];
  addTransaction: (cashbookId: string, input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, updates: TransactionUpdate) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
  addPaymentMode: (name: string) => Promise<PaymentMode>;
  removePaymentMode: (id: string) => Promise<void>;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "", name: "Salary" },
  { id: "", name: "Groceries" },
  { id: "", name: "Rent" },
  { id: "", name: "Utilities" },
  { id: "", name: "Consulting" },
];

const DEFAULT_PAYMENT_MODES: PaymentMode[] = [
  { id: "", name: "Cash" },
  { id: "", name: "Bank Transfer" },
  { id: "", name: "Card" },
  { id: "", name: "Digital Wallet" },
];

const cloneCategories = (categories: Category[]) => categories.map((category) => ({ ...category }));
const clonePaymentModes = (modes: PaymentMode[]) => modes.map((mode) => ({ ...mode }));

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

const recalcCashbooks = (cashbooks: Cashbook[], transactions: Transaction[]): Cashbook[] =>
  cashbooks.map((cashbook) => ({
    ...cashbook,
    balance: calculateBalance(cashbook.id, transactions),
    lastActivity: getLatestActivity(cashbook.id, transactions) ?? cashbook.lastActivity ?? null,
  }));

const CashbookContext = createContext<CashbookContextValue | undefined>(undefined);

export const CashbookProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cashbooks, setCashbooks] = useState<Cashbook[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(cloneCategories(DEFAULT_CATEGORIES));
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(clonePaymentModes(DEFAULT_PAYMENT_MODES));
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!user) {
        setCashbooks([]);
        setTransactions([]);
        setCategories(cloneCategories(DEFAULT_CATEGORIES));
        setPaymentModes(clonePaymentModes(DEFAULT_PAYMENT_MODES));
        return;
      }

      try {
        const [cashbookResponse, categoryResponse, modeResponse, transactionResponse] = await Promise.all([
          supabase
            .from("cashbooks")
            .select("id, name, currency, updated_at")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("categories")
            .select("id, name")
            .eq("owner_id", user.id)
            .order("name", { ascending: true }),
          supabase
            .from("modes")
            .select("id, name")
            .eq("owner_id", user.id)
            .order("name", { ascending: true }),
          supabase
            .from("transactions")
            .select("id, cashbook_id, type, amount, description, category_id, mode_id, transaction_datetime")
            .eq("recorded_by_user_id", user.id)
            .order("transaction_datetime", { ascending: false }),
        ]);

        if (!isMounted) {
          return;
        }

        if (cashbookResponse.error) throw cashbookResponse.error;
        if (categoryResponse.error) throw categoryResponse.error;
        if (modeResponse.error) throw modeResponse.error;
        if (transactionResponse.error) throw transactionResponse.error;

        let categoryRows = categoryResponse.data ?? [];
        if (categoryRows.length === 0) {
          const { error: seedCategoriesError } = await supabase
            .from("categories")
            .upsert(
              DEFAULT_CATEGORIES.map((category) => ({ name: category.name, owner_id: user.id })),
              { onConflict: "owner_id,name" },
            );
          if (seedCategoriesError) {
            console.error("Failed to seed categories", seedCategoriesError);
          } else {
            const refreshedCategories = await supabase
              .from("categories")
              .select("id, name")
              .eq("owner_id", user.id)
              .order("name", { ascending: true });
            if (!refreshedCategories.error && refreshedCategories.data) {
              categoryRows = refreshedCategories.data;
            }
          }
        }

        if (!isMounted) {
          return;
        }

        let modeRows = modeResponse.data ?? [];
        if (modeRows.length === 0) {
          const { error: seedModesError } = await supabase
            .from("modes")
            .upsert(
              DEFAULT_PAYMENT_MODES.map((mode) => ({ name: mode.name, owner_id: user.id })),
              { onConflict: "owner_id,name" },
            );
          if (seedModesError) {
            console.error("Failed to seed payment modes", seedModesError);
          } else {
            const refreshedModes = await supabase
              .from("modes")
              .select("id, name")
              .eq("owner_id", user.id)
              .order("name", { ascending: true });
            if (!refreshedModes.error && refreshedModes.data) {
              modeRows = refreshedModes.data;
            }
          }
        }

        if (!isMounted) {
          return;
        }


        const categoryNameById = new Map<string, string>();
        categoryRows.forEach((row) => {
          if (row?.id && row?.name) {
            categoryNameById.set(row.id, row.name);
          }
        });

        const modeNameById = new Map<string, string>();
        modeRows.forEach((row) => {
          if (row?.id && row?.name) {
            modeNameById.set(row.id, row.name);
          }
        });

        const categoryList = categoryRows.map((row) => ({ id: row.id, name: row.name }));
        const modeList = modeRows.map((row) => ({ id: row.id, name: row.name }));

        const transactionList = (transactionResponse.data ?? []).map((row) => ({
          id: row.id,
          cashbookId: row.cashbook_id,
          type: row.type as TransactionType,
          amount:
            typeof row.amount === "number"
              ? row.amount
              : parseFloat(typeof row.amount === "string" ? row.amount : "0"),
          description: row.description,
          category: categoryNameById.get(row.category_id ?? "") ?? "Uncategorized",
          mode: modeNameById.get(row.mode_id ?? "") ?? "Unknown",
          date: row.transaction_datetime,
        }));

        const baseCashbooks = (cashbookResponse.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          currency: row.currency ?? DEFAULT_CURRENCY,
          balance: 0,
          lastActivity: row.updated_at ?? null,
        }));

        const recalculatedCashbooks = recalcCashbooks(baseCashbooks, transactionList);

        setCategories(categoryList.length ? categoryList : cloneCategories(DEFAULT_CATEGORIES));
        setPaymentModes(modeList.length ? modeList : clonePaymentModes(DEFAULT_PAYMENT_MODES));
        setTransactions(transactionList);
        setCashbooks(recalculatedCashbooks);
      } catch (error) {
        console.error("Failed to load cashbook data", error);
        if (!isMounted) {
          return;
        }
        setCashbooks([]);
        setTransactions([]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getCashbookById = useCallback(
    (id: string) => cashbooks.find((cashbook) => cashbook.id === id),
    [cashbooks],
  );

  const getTransactionsForCashbook = useCallback(
    (cashbookId: string) => transactions.filter((transaction) => transaction.cashbookId === cashbookId),
    [transactions],
  );

  const createCashbook = useCallback(
    async (name: string, currency: string) => {
      if (!user) {
        throw new Error("You must be signed in to create a cashbook.");
      }

      const { data, error } = await supabase
        .from("cashbooks")
        .insert({ name, currency, owner_id: user.id })
        .select("id, name, currency, updated_at")
        .single();

      if (error || !data) {
        console.error("Failed to create cashbook", error);
        throw error ?? new Error("Unable to create cashbook");
      }

      const newCashbook: Cashbook = {
        id: data.id,
        name: data.name,
        currency: data.currency ?? DEFAULT_CURRENCY,
        balance: 0,
        lastActivity: data.updated_at ?? null,
      };

      setCashbooks((prev) => [...prev, newCashbook]);
      return newCashbook;
    },
    [user],
  );

  const updateCashbook = useCallback(
    async (id: string, updates: CashbookUpdate) => {
      if (!user) {
        throw new Error("You must be signed in to update a cashbook.");
      }

      const payload: Record<string, unknown> = {};
      if (typeof updates.name === "string") {
        payload.name = updates.name;
      }
      if (typeof updates.currency === "string") {
        payload.currency = updates.currency;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("cashbooks")
        .update(payload)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("id, name, currency, updated_at")
        .single();

      if (error || !data) {
        console.error("Failed to update cashbook", error);
        throw error ?? new Error("Unable to update cashbook");
      }

      setCashbooks((prev) =>
        prev.map((cashbook) =>
          cashbook.id === id
            ? {
                ...cashbook,
                name: data.name,
                currency: data.currency ?? cashbook.currency,
                lastActivity: data.updated_at ?? cashbook.lastActivity,
              }
            : cashbook,
        ),
      );
    },
    [user],
  );

  const deleteCashbook = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("You must be signed in to delete a cashbook.");
      }

      const { error } = await supabase
        .from("cashbooks")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        console.error("Failed to delete cashbook", error);
        throw error;
      }

      setTransactions((prevTransactions) => {
        const updatedTransactions = prevTransactions.filter((transaction) => transaction.cashbookId !== id);
        setCashbooks((prevCashbooks) =>
          recalcCashbooks(prevCashbooks.filter((cashbook) => cashbook.id !== id), updatedTransactions),
        );
        return updatedTransactions;
      });
    },
    [user],
  );

  const findCategoryByName = useCallback(
    async (name: string) => {
      if (!user) {
        throw new Error("You must be signed in to manage categories.");
      }

      const normalized = name.trim().toLowerCase();
      const existing = categories.find((category) => category.name.toLowerCase() === normalized);
      if (existing && existing.id) {
        return existing;
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({ name: name.trim(), owner_id: user.id })
        .select("id, name")
        .single();

      if (error || !data) {
        console.error("Failed to create category", error);
        throw error ?? new Error("Unable to create category");
      }

      const category = { id: data.id, name: data.name };
      setCategories((prev) => [...prev, category]);
      return category;
    },
    [categories, user],
  );

  const findModeByName = useCallback(
    async (name: string) => {
      if (!user) {
        throw new Error("You must be signed in to manage payment modes.");
      }

      const normalized = name.trim().toLowerCase();
      const existing = paymentModes.find((mode) => mode.name.toLowerCase() === normalized);
      if (existing && existing.id) {
        return existing;
      }

      const { data, error } = await supabase
        .from("modes")
        .insert({ name: name.trim(), owner_id: user.id })
        .select("id, name")
        .single();

      if (error || !data) {
        console.error("Failed to create payment mode", error);
        throw error ?? new Error("Unable to create payment mode");
      }

      const mode = { id: data.id, name: data.name };
      setPaymentModes((prev) => [...prev, mode]);
      return mode;
    },
    [paymentModes, user],
  );

  const addTransaction = useCallback(
    async (cashbookId: string, input: TransactionInput) => {
      if (!user) {
        throw new Error("You must be signed in to add a transaction.");
      }

      const category = await findCategoryByName(input.category);
      const mode = await findModeByName(input.mode);

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          cashbook_id: cashbookId,
          type: input.type,
          amount: input.amount,
          description: input.description,
          category_id: category.id,
          mode_id: mode.id,
          transaction_datetime: new Date(input.date).toISOString(),
          recorded_by_user_id: user.id,
        })
        .select("id, cashbook_id, type, amount, description, category_id, mode_id, transaction_datetime")
        .single();

      if (error || !data) {
        console.error("Failed to add transaction", error);
        throw error ?? new Error("Unable to add transaction");
      }

      const transaction: Transaction = {
        id: data.id,
        cashbookId: data.cashbook_id,
        type: data.type as TransactionType,
        amount:
          typeof data.amount === "number"
            ? data.amount
            : parseFloat(typeof data.amount === "string" ? data.amount : "0"),
        description: data.description,
        category: category.name,
        mode: mode.name,
        date: data.transaction_datetime,
      };

      setTransactions((prev) => {
        const updatedTransactions = [transaction, ...prev];
        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });
    },
    [findCategoryByName, findModeByName, user],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: TransactionUpdate) => {
      if (!user) {
        throw new Error("You must be signed in to update a transaction.");
      }

      const existing = transactions.find((transaction) => transaction.id === id);
      if (!existing) {
        throw new Error("Transaction not found");
      }

      const payload: Record<string, unknown> = {};

      if (updates.cashbookId && updates.cashbookId !== existing.cashbookId) {
        payload.cashbook_id = updates.cashbookId;
      }
      if (updates.type && updates.type !== existing.type) {
        payload.type = updates.type;
      }
      if (typeof updates.amount === "number" && updates.amount !== existing.amount) {
        payload.amount = updates.amount;
      }
      if (typeof updates.description === "string" && updates.description !== existing.description) {
        payload.description = updates.description;
      }
      if (typeof updates.date === "string" && updates.date !== existing.date) {
        payload.transaction_datetime = new Date(updates.date).toISOString();
      }

      let categoryName = existing.category;
      if (typeof updates.category === "string" && updates.category.trim() && updates.category !== existing.category) {
        const category = await findCategoryByName(updates.category);
        payload.category_id = category.id;
        categoryName = category.name;
      }

      let modeName = existing.mode;
      if (typeof updates.mode === "string" && updates.mode.trim() && updates.mode !== existing.mode) {
        const mode = await findModeByName(updates.mode);
        payload.mode_id = mode.id;
        modeName = mode.name;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", id)
        .eq("recorded_by_user_id", user.id)
        .select("id, cashbook_id, type, amount, description, category_id, mode_id, transaction_datetime")
        .single();

      if (error || !data) {
        console.error("Failed to update transaction", error);
        throw error ?? new Error("Unable to update transaction");
      }

      const updatedTransaction: Transaction = {
        id: data.id,
        cashbookId: data.cashbook_id,
        type: data.type as TransactionType,
        amount:
          typeof data.amount === "number"
            ? data.amount
            : parseFloat(typeof data.amount === "string" ? data.amount : "0"),
        description: data.description,
        category: categoryName,
        mode: modeName,
        date: data.transaction_datetime,
      };

      setTransactions((prev) => {
        const updatedTransactions = prev.map((transaction) =>
          transaction.id === id ? updatedTransaction : transaction,
        );
        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });
    },
    [findCategoryByName, findModeByName, transactions, user],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("You must be signed in to delete a transaction.");
      }

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("recorded_by_user_id", user.id);

      if (error) {
        console.error("Failed to delete transaction", error);
        throw error;
      }

      setTransactions((prev) => {
        const updatedTransactions = prev.filter((transaction) => transaction.id !== id);
        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });
    },
    [user],
  );

  const addCategory = useCallback(
    async (name: string) => {
      const category = await findCategoryByName(name);
      return category;
    },
    [findCategoryByName],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("You must be signed in to delete a category.");
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        console.error("Failed to delete category", error);
        throw error;
      }

      setCategories((prev) => prev.filter((category) => category.id !== id));
    },
    [user],
  );

  const addPaymentMode = useCallback(
    async (name: string) => {
      const mode = await findModeByName(name);
      return mode;
    },
    [findModeByName],
  );

  const removePaymentMode = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("You must be signed in to delete a payment mode.");
      }

      const { error } = await supabase
        .from("modes")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        console.error("Failed to delete payment mode", error);
        throw error;
      }

      setPaymentModes((prev) => prev.filter((mode) => mode.id !== id));
    },
    [user],
  );

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
