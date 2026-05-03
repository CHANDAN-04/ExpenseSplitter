import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// 🔐 LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/login", data);

      const token = res.data.data.accessToken;
      const user = res.data.data.user;

      // ✅ Save token to localStorage for axios headers
      localStorage.setItem("token", token);

      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  },
);

// 📝 REGISTER
export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/register", data);
      return res.data.message || "Registration successful";
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);

/** Validates stored JWT on startup; 401 handled by axios interceptor (logout) */
export const validateSession = createAsyncThunk(
  "auth/validateSession",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/auth/me");
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Session validation failed",
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await API.put("/users/profile", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not update profile",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    successMessage: null,
    isHydrated: false, // Track if Redux has rehydrated from storage
  },

  reducers: {
    logout: (state) => {
      // ✅ Clear both localStorage and Redux state
      localStorage.removeItem("token");
      state.user = null;
      state.error = null;
      state.successMessage = null;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    // ✅ Mark when rehydration is complete
    setHydrated: (state) => {
      state.isHydrated = true;
    },
  },

  extraReducers: (builder) => {
    builder

      // 🔐 LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      })

      // 📝 REGISTER
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(validateSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isHydrated = true;
      })
      .addCase(validateSession.rejected, (state) => {
        state.isHydrated = true;
      })

      .addCase(updateProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Update failed";
      });
  },
});

export const { logout, clearMessages, setHydrated } = authSlice.actions;
export default authSlice.reducer;
