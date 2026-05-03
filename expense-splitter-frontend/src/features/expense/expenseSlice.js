import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const getGroupExpenses = createAsyncThunk(
  "expense/getGroupExpenses",
  async (groupId) => {
    const res = await API.get(`/expenses/group/${groupId}`);
    return res.data.data;
  },
);

export const createExpense = createAsyncThunk(
  "expense/create",
  async (data) => {
    const res = await API.post("/expenses", data);
    return res.data.data;
  },
);

const expenseSlice = createSlice({
  name: "expense",
  initialState: {
    expenses: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getGroupExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGroupExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.expenses || [];
      })
      .addCase(getGroupExpenses.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      });
  },
});

export default expenseSlice.reducer;
