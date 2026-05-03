import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const getDashboardSummary = createAsyncThunk(
  "dashboard/getSummary",
  async () => {
    const res = await API.get("/dashboard/summary");
    return res.data.data;
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getDashboardSummary.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default dashboardSlice.reducer;

