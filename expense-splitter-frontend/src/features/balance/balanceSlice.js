import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const getUserSummary = createAsyncThunk(
  "balance/getSummary",
  async () => {
    const res = await API.get("/balances/user/summary");
    return res.data.data;
  },
);

const balanceSlice = createSlice({
  name: "balance",
  initialState: {
    summary: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getUserSummary.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default balanceSlice.reducer;
