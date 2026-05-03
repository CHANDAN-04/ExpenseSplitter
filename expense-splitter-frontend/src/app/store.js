import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import authReducer from "../features/auth/authSlice";
import groupReducer from "../features/group/groupSlice";
import expenseReducer from "../features/expense/expenseSlice";
import balanceReducer from "../features/balance/balanceSlice";
import userReducer from "../features/user/userSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import settlementReducer from "../features/settlement/settlementSlice";

// ✅ Safe async storage wrapper - returns promises
const safeStorage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return Promise.resolve(item);
    } catch (e) {
      console.warn("localStorage.getItem failed:", e);
      return Promise.resolve(null);
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      console.warn("localStorage.setItem failed:", e);
      return Promise.resolve();
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
      console.warn("localStorage.removeItem failed:", e);
      return Promise.resolve();
    }
  },
};

// ✅ Persist configuration - only for auth and group slices
const authPersistConfig = {
  key: "auth",
  storage: safeStorage,
  whitelist: ["user"], // Only persist user
};

const groupPersistConfig = {
  key: "group",
  storage: safeStorage,
  whitelist: ["selectedGroup"], // Only persist selected group
};

// ✅ Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedGroupReducer = persistReducer(groupPersistConfig, groupReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    group: persistedGroupReducer,
    balance: balanceReducer,
    expense: expenseReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    settlement: settlementReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
