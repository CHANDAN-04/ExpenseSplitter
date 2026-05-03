import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const loadGroupSettlementData = createAsyncThunk(
  "settlement/loadGroup",
  async (groupId) => {
    const gid = String(groupId || "").trim();
    const [listRes, histRes] = await Promise.all([
      API.get("/settlements", { params: { groupId: gid } }),
      API.get("/settlements/history", { params: { groupId: gid } }),
    ]);
    return {
      groupId: gid,
      incomingRequests: listRes.data.data.incomingRequests || [],
      outgoingRequests: listRes.data.data.outgoingRequests || [],
      history: histRes.data.data || [],
    };
  },
);

export const createSettlementRequest = createAsyncThunk(
  "settlement/createRequest",
  async (
    { groupId, toUserId, amount, type, note, paymentMode },
    { rejectWithValue },
  ) => {
    try {
      const body = {
        groupId,
        toUserId,
        amount,
        type,
        note: note || undefined,
      };
      if (paymentMode) {
        body.paymentMode = paymentMode;
      }
      const res = await API.post("/settlements/request", body);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not create request",
      );
    }
  },
);

export const respondToSettlementRequest = createAsyncThunk(
  "settlement/respond",
  async ({ settlementId, action }, { rejectWithValue }) => {
    try {
      const res = await API.patch(`/settlements/${settlementId}/respond`, {
        action,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not update request",
      );
    }
  },
);

export const cancelSettlementRequest = createAsyncThunk(
  "settlement/cancel",
  async (settlementId, { rejectWithValue }) => {
    try {
      const res = await API.delete(`/settlements/${settlementId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not cancel request",
      );
    }
  },
);

const settlementSlice = createSlice({
  name: "settlement",
  initialState: {
    incomingRequests: [],
    outgoingRequests: [],
    history: [],
    currentGroupId: null,
    loading: false,
  },
  reducers: {
    clearSettlementGroup: (state) => {
      state.incomingRequests = [];
      state.outgoingRequests = [];
      state.history = [];
      state.currentGroupId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGroupSettlementData.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadGroupSettlementData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroupId = action.payload.groupId;
        state.incomingRequests = action.payload.incomingRequests;
        state.outgoingRequests = action.payload.outgoingRequests;
        state.history = action.payload.history;
      })
      .addCase(loadGroupSettlementData.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { clearSettlementGroup } = settlementSlice.actions;
export default settlementSlice.reducer;
