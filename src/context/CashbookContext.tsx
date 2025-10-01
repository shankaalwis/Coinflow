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

import { supabase } from "@/integrations/supabase/client";
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
  primaryCurrency: string;
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
  primaryCurrency: string;
  updatePrimaryCurrency: (currency: string) => void;
};

const STORAGE_KEY_PREFIX = "coinflow:data";

const isBrowser = typeof window !== "undefined";

const DEFAULT_CATEGORY_NAMES = ["Salary", "Groceries", "Rent", "Utilities", "Consulting"] as const;

const DEFAULT_PAYMENT_MODE_NAMES = ["Cash", "Bank Transfer", "Card", "Digital Wallet"] as const;

const DEFAULT_PRIMARY_CURRENCY = "USD";

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createDefaultCategories = (): Category[] =>
  DEFAULT_CATEGORY_NAMES.map((name) => ({ id: generateId(), name }));

const createDefaultPaymentModes = (): PaymentMode[] =>
  DEFAULT_PAYMENT_MODE_NAMES.map((name) => ({ id: generateId(), name }));

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
  categories: createDefaultCategories(),
  paymentModes: createDefaultPaymentModes(),
  primaryCurrency: DEFAULT_PRIMARY_CURRENCY,
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
      categories: parsed.categories?.length ? parsed.categories : createDefaultCategories(),
      paymentModes: parsed.paymentModes?.length ? parsed.paymentModes : createDefaultPaymentModes(),
      primaryCurrency: typeof parsed.primaryCurrency === "string" && parsed.primaryCurrency
        ? parsed.primaryCurrency
        : DEFAULT_PRIMARY_CURRENCY,
    };
  } catch (error) {
    console.error("Failed to read cashbook data from storage", error);
    return buildDefaultState();
  }
};

const ensureUuidWithCache = (value: string, cache: Map<string, string>) => {
  if (UUID_REGEX.test(value)) {
    return value;
  }

  if (cache.has(value)) {
    return cache.get(value)!;
  }

  const newId = generateId();
  cache.set(value, newId);
  return newId;
};

const normalizeStateForPersistence = (state: PersistedState): PersistedState => {
  const cashbookIdMap = new Map<string, string>();
  const categoryIdMap = new Map<string, string>();
  const paymentModeIdMap = new Map<string, string>();
  const transactionIdMap = new Map<string, string>();

  const cashbooks = state.cashbooks.map((cashbook) => ({
    ...cashbook,
    id: ensureUuidWithCache(cashbook.id, cashbookIdMap),
  }));

  const categories = state.categories.map((category) => ({
    ...category,
    id: ensureUuidWithCache(category.id, categoryIdMap),
  }));

  const paymentModes = state.paymentModes.map((mode) => ({
    ...mode,
    id: ensureUuidWithCache(mode.id, paymentModeIdMap),
  }));

  const transactions = state.transactions.map((transaction) => {
    const nextCashbookId = cashbookIdMap.get(transaction.cashbookId) ?? transaction.cashbookId;
    const normalizedCashbookId = UUID_REGEX.test(nextCashbookId)
      ? nextCashbookId
      : ensureUuidWithCache(nextCashbookId, cashbookIdMap);

    return {
      ...transaction,
      id: ensureUuidWithCache(transaction.id, transactionIdMap),
      cashbookId: normalizedCashbookId,
    };
  });

  return {
    cashbooks,
    transactions,
    categories,
    paymentModes,
    primaryCurrency: state.primaryCurrency || DEFAULT_PRIMARY_CURRENCY,
  };
};

const recalcCashbooks = (cashbooks: Cashbook[], transactions: Transaction[]): Cashbook[] =>
  cashbooks.map((cashbook) => ({
    ...cashbook,
    balance: calculateBalance(cashbook.id, transactions),
    lastActivity: getLatestActivity(cashbook.id, transactions),
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
  const [categories, setCategories] = useState<Category[]>(() => createDefaultCategories());
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(() => createDefaultPaymentModes());
  const [primaryCurrency, setPrimaryCurrency] = useState<string>(DEFAULT_PRIMARY_CURRENCY);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  const applyPersistedState = useCallback((state: PersistedState) => {
    const normalized = normalizeStateForPersistence(state);
    const recalculatedCashbooks = recalcCashbooks(normalized.cashbooks, normalized.transactions);
    setCashbooks(recalculatedCashbooks);
    setTransactions(normalized.transactions);
    setCategories(cloneCategories(normalized.categories));
    setPaymentModes(clonePaymentModes(normalized.paymentModes));
    setPrimaryCurrency(normalized.primaryCurrency || DEFAULT_PRIMARY_CURRENCY);
  }, []);

  const loadStateFromSupabase = useCallback(
    async (userId: string): Promise<PersistedState | null> => {
      try {
        const [cashbookResponse, transactionResponse, categoryResponse, modeResponse] = await Promise.all([
          supabase.from("cashbooks").select("id, name").eq("owner_id", userId),
          supabase
            .from("transactions")
            .select("id, cashbook_id, type, amount, description, category_id, mode_id, transaction_datetime")
            .eq("recorded_by_user_id", userId),
          supabase.from("categories").select("id, name").eq("owner_id", userId),
          supabase.from("modes").select("id, name").eq("owner_id", userId),
        ]);

        if (cashbookResponse.error || transactionResponse.error || categoryResponse.error || modeResponse.error) {
          console.error("Failed to load data from Supabase", {
            cashbookError: cashbookResponse.error,
            transactionError: transactionResponse.error,
            categoryError: categoryResponse.error,
            modeError: modeResponse.error,
          });
          return null;
        }

        let categories = (categoryResponse.data ?? []).map((row) => ({ id: row.id, name: row.name }));
        if (!categories.length) {
          const defaults = createDefaultCategories();
          const { error: insertCategoriesError } = await supabase
            .from("categories")
            .insert(defaults.map((category) => ({ id: category.id, name: category.name, owner_id: userId })));

          if (insertCategoriesError) {
            console.error("Failed to insert default categories", insertCategoriesError);
          }

          categories = defaults;
        }

        let paymentModes = (modeResponse.data ?? []).map((row) => ({ id: row.id, name: row.name }));
        if (!paymentModes.length) {
          const defaults = createDefaultPaymentModes();
          const { error: insertModesError } = await supabase
            .from("modes")
            .insert(defaults.map((mode) => ({ id: mode.id, name: mode.name, owner_id: userId })));

          if (insertModesError) {
            console.error("Failed to insert default payment modes", insertModesError);
          }

          paymentModes = defaults;
        }

        const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
        const paymentModeNameById = new Map(paymentModes.map((mode) => [mode.id, mode.name]));

        const transactions: Transaction[] = (transactionResponse.data ?? []).map((row) => ({
          id: row.id,
          cashbookId: row.cashbook_id,
          type: row.type as TransactionType,
          amount: row.amount,
          description: row.description,
          category: categoryNameById.get(row.category_id) ?? "Uncategorized",
          mode: paymentModeNameById.get(row.mode_id) ?? "Unknown",
          date: row.transaction_datetime,
        }));

        const cashbooks: Cashbook[] = (cashbookResponse.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          balance: 0,
          lastActivity: null,
        }));

        const recalculatedCashbooks = recalcCashbooks(cashbooks, transactions);

        return {
          cashbooks: recalculatedCashbooks,
          transactions,
          categories,
          paymentModes,
          primaryCurrency: DEFAULT_PRIMARY_CURRENCY,
        };
      } catch (error) {
        console.error("Unexpected error while loading data from Supabase", error);
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    let isCancelled = false;
    setHydratedKey(null);

    const hydrate = async () => {
      const localSnapshot = loadPersistedState(storageKey);
      let state: PersistedState | null = null;

      if (user?.id) {
        state = await loadStateFromSupabase(user.id);
      }

      if (isCancelled) {
        return;
      }

      const fallbackState = state
        ? {
            ...state,
            primaryCurrency: state.primaryCurrency || localSnapshot.primaryCurrency || DEFAULT_PRIMARY_CURRENCY,
          }
        : localSnapshot;
      applyPersistedState(fallbackState);
      setHydratedKey(storageKey);
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, [applyPersistedState, loadStateFromSupabase, storageKey, user?.id]);

  useEffect(() => {
    if (!isBrowser || hydratedKey !== storageKey) {
      return;
    }

    const state: PersistedState = normalizeStateForPersistence({
      cashbooks,
      transactions,
      categories,
      paymentModes,
      primaryCurrency,
    });

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [cashbooks, transactions, categories, paymentModes, primaryCurrency, storageKey, hydratedKey]);

  const getCashbookById = useCallback(
    (id: string) => cashbooks.find((cashbook) => cashbook.id === id),
    [cashbooks],
  );

  const getTransactionsForCashbook = useCallback(
    (cashbookId: string) => transactions.filter((transaction) => transaction.cashbookId === cashbookId),
    [transactions],
  );

  const createCashbook = useCallback(
    (name: string) => {
      const id = generateId();

      const newCashbook: Cashbook = {
        id,
        name,
        balance: 0,
        lastActivity: null,
      };

      setCashbooks((prev) => [...prev, newCashbook]);

      if (user?.id) {
        void (async () => {
          const { error } = await supabase.from("cashbooks").insert({
            id,
            name,
            owner_id: user.id,
          });

          if (error) {
            console.error("Failed to persist cashbook to Supabase", error);
          }
        })();
      }

      return newCashbook;
    },
    [user?.id],
  );

  const updateCashbook = useCallback(
    (id: string, updates: CashbookUpdate) => {
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

      if (user?.id && typeof updates.name === "string") {
        void (async () => {
          const { error } = await supabase
            .from("cashbooks")
            .update({ name: updates.name, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("owner_id", user.id);

          if (error) {
            console.error("Failed to update cashbook in Supabase", error);
          }
        })();
      }
    },
    [user?.id],
  );

  const deleteCashbook = useCallback(
    (id: string) => {
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

      if (user?.id) {
        void (async () => {
          const { error: transactionError } = await supabase
            .from("transactions")
            .delete()
            .eq("cashbook_id", id)
            .eq("recorded_by_user_id", user.id);

          if (transactionError) {
            console.error("Failed to delete transactions for cashbook in Supabase", transactionError);
          }

          const { error: cashbookError } = await supabase
            .from("cashbooks")
            .delete()
            .eq("id", id)
            .eq("owner_id", user.id);

          if (cashbookError) {
            console.error("Failed to delete cashbook in Supabase", cashbookError);
          }
        })();
      }
    },
    [user?.id],
  );

  const addTransaction = useCallback(
    (cashbookId: string, input: TransactionInput) => {
      const id = generateId();
      const transaction: Transaction = {
        id,
        cashbookId,
        ...input,
      };

      setTransactions((prev) => {
        const updatedTransactions = [...prev, transaction];
        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });

      if (user?.id) {
        const category = categories.find((item) => item.name === input.category);
        const mode = paymentModes.find((item) => item.name === input.mode);

        if (category && mode) {
          void (async () => {
            const { error } = await supabase.from("transactions").insert({
              id,
              cashbook_id: cashbookId,
              type: input.type,
              amount: input.amount,
              description: input.description,
              category_id: category.id,
              mode_id: mode.id,
              transaction_datetime: input.date,
              recorded_by_user_id: user.id,
            });

            if (error) {
              console.error("Failed to insert transaction in Supabase", error);
            }
          })();
        } else {
          console.warn("Unable to persist transaction: missing category or payment mode mapping", {
            category: input.category,
            mode: input.mode,
          });
        }
      }
    },
    [categories, paymentModes, user?.id],
  );

  const updateTransaction = useCallback(
    (id: string, updates: TransactionUpdate) => {
      let nextTransaction: Transaction | null = null;

      setTransactions((prev) => {
        const updatedTransactions = prev.map((transaction) => {
          if (transaction.id !== id) {
            return transaction;
          }

          const merged: Transaction = {
            ...transaction,
            ...updates,
            cashbookId: updates.cashbookId ?? transaction.cashbookId,
          };

          nextTransaction = merged;
          return merged;
        });

        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });

      if (user?.id && nextTransaction) {
        const category = categories.find((item) => item.name === nextTransaction.category);
        const mode = paymentModes.find((item) => item.name === nextTransaction.mode);

        if (category && mode) {
          void (async () => {
            const { error } = await supabase
              .from("transactions")
              .update({
                cashbook_id: nextTransaction!.cashbookId,
                type: nextTransaction!.type,
                amount: nextTransaction!.amount,
                description: nextTransaction!.description,
                category_id: category.id,
                mode_id: mode.id,
                transaction_datetime: nextTransaction!.date,
                updated_at: new Date().toISOString(),
              })
              .eq("id", nextTransaction!.id)
              .eq("recorded_by_user_id", user.id);

            if (error) {
              console.error("Failed to update transaction in Supabase", error);
            }
          })();
        } else {
          console.warn("Unable to persist transaction update: missing category or payment mode mapping", {
            category: nextTransaction.category,
            mode: nextTransaction.mode,
          });
        }
      }
    },
    [categories, paymentModes, user?.id],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => {
        const updatedTransactions = prev.filter((transaction) => transaction.id !== id);
        setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
        return updatedTransactions;
      });

      if (user?.id) {
        void (async () => {
          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .eq("recorded_by_user_id", user.id);

          if (error) {
            console.error("Failed to delete transaction in Supabase", error);
          }
        })();
      }
    },
    [user?.id],
  );

  const addCategory = useCallback(
    (name: string) => {
      const normalizedName = name.trim();
      if (!normalizedName) {
        return;
      }

      let categoryToInsert: Category | null = null;

      setCategories((prev) => {
        const exists = prev.some((category) => category.name.toLowerCase() === normalizedName.toLowerCase());
        if (exists) {
          return prev;
        }

        categoryToInsert = { id: generateId(), name: normalizedName };
        return [...prev, categoryToInsert];
      });

      if (categoryToInsert && user?.id) {
        void (async () => {
          const { error } = await supabase
            .from("categories")
            .insert({ id: categoryToInsert!.id, name: categoryToInsert!.name, owner_id: user.id });

          if (error) {
            console.error("Failed to insert category in Supabase", error);
          }
        })();
      }
    },
    [user?.id],
  );

  const removeCategory = useCallback(
    (id: string) => {
      const category = categories.find((item) => item.id === id);
      if (!category) {
        return;
      }

      const relatedTransactionIds = transactions
        .filter((transaction) => transaction.category === category.name)
        .map((transaction) => transaction.id);

      if (relatedTransactionIds.length) {
        setTransactions((prev) => {
          const updatedTransactions = prev.filter((transaction) => transaction.category !== category.name);
          setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
          return updatedTransactions;
        });
      }

      setCategories((prev) => prev.filter((categoryItem) => categoryItem.id !== id));

      if (user?.id) {
        void (async () => {
          if (relatedTransactionIds.length) {
            const { error: transactionError } = await supabase
              .from("transactions")
              .delete()
              .eq("recorded_by_user_id", user.id)
              .in("id", relatedTransactionIds);

            if (transactionError) {
              console.error("Failed to delete transactions for category in Supabase", transactionError);
            }
          }

          const { error: categoryError } = await supabase
            .from("categories")
            .delete()
            .eq("id", id)
            .eq("owner_id", user.id);

          if (categoryError) {
            console.error("Failed to delete category in Supabase", categoryError);
          }
        })();
      }
    },
    [categories, transactions, user?.id],
  );

  const addPaymentMode = useCallback(
    (name: string) => {
      const normalizedName = name.trim();
      if (!normalizedName) {
        return;
      }

      let modeToInsert: PaymentMode | null = null;

      setPaymentModes((prev) => {
        const exists = prev.some((mode) => mode.name.toLowerCase() === normalizedName.toLowerCase());
        if (exists) {
          return prev;
        }

        modeToInsert = { id: generateId(), name: normalizedName };
        return [...prev, modeToInsert];
      });

      if (modeToInsert && user?.id) {
        void (async () => {
          const { error } = await supabase
            .from("modes")
            .insert({ id: modeToInsert!.id, name: modeToInsert!.name, owner_id: user.id });

          if (error) {
            console.error("Failed to insert payment mode in Supabase", error);
          }
        })();
      }
    },
    [user?.id],
  );

  const removePaymentMode = useCallback(
    (id: string) => {
      const mode = paymentModes.find((item) => item.id === id);
      if (!mode) {
        return;
      }

      const relatedTransactionIds = transactions
        .filter((transaction) => transaction.mode === mode.name)
        .map((transaction) => transaction.id);

      if (relatedTransactionIds.length) {
        setTransactions((prev) => {
          const updatedTransactions = prev.filter((transaction) => transaction.mode !== mode.name);
          setCashbooks((prevCashbooks) => recalcCashbooks(prevCashbooks, updatedTransactions));
          return updatedTransactions;
        });
      }

      setPaymentModes((prev) => prev.filter((modeItem) => modeItem.id !== id));

      if (user?.id) {
        void (async () => {
          if (relatedTransactionIds.length) {
            const { error: transactionError } = await supabase
              .from("transactions")
              .delete()
              .eq("recorded_by_user_id", user.id)
              .in("id", relatedTransactionIds);

            if (transactionError) {
              console.error("Failed to delete transactions for payment mode in Supabase", transactionError);
            }
          }

          const { error: modeError } = await supabase
            .from("modes")
            .delete()
            .eq("id", id)
            .eq("owner_id", user.id);

          if (modeError) {
            console.error("Failed to delete payment mode in Supabase", modeError);
          }
        })();
      }
    },
    [paymentModes, transactions, user?.id],
  );

  const updatePrimaryCurrency = useCallback((currency: string) => {
    const normalized = currency.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    setPrimaryCurrency(normalized);
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
      primaryCurrency,
      updatePrimaryCurrency,
    }),
    [
      cashbooks,
      transactions,
      categories,
      paymentModes,
      primaryCurrency,
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
      updatePrimaryCurrency,
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

