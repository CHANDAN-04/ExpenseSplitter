import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const getGroups = createAsyncThunk("group/getGroups", async () => {
  const res = await API.get("/groups");
  return res.data.data;
});

export const getGroupDetails = createAsyncThunk(
  "group/getDetails",
  async (groupId) => {
    const res = await API.get(`/groups/${groupId}`);
    return res.data.data;
  },
);
export const getGroupMembers = createAsyncThunk(
  "group/getMembers",
  async (groupId) => {
    const res = await API.get(`/groups/${groupId}/members`);
    return res.data.data;
  },
);

export const getGroupBalances = createAsyncThunk(
  "group/getBalances",
  async (groupId) => {
    const res = await API.get(`/balances/${groupId}`);
    return res.data.data;
  },
);

export const createGroup = createAsyncThunk(
  "group/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/groups", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Create group failed",
      );
    }
  },
);

export const removeMember = createAsyncThunk(
  "group/removeMember",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      await API.delete(`/groups/${groupId}/members/${userId}`);
      return userId; // return removed userId
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove member",
      );
    }
  },
);

export const leaveGroup = createAsyncThunk(
  "group/leave",
  async (groupId, { rejectWithValue }) => {
    try {
      await API.delete(`/groups/${groupId}/leave`);
      return groupId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to leave group",
      );
    }
  },
);

export const deleteGroup = createAsyncThunk(
  "group/delete",
  async (groupId, { rejectWithValue }) => {
    try {
      await API.delete(`/groups/${groupId}`);
      return groupId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete group",
      );
    }
  },
);

export const searchGroups = createAsyncThunk(
  "group/searchGroups",
  async (query, { rejectWithValue }) => {
    try {
      if (!query.trim()) {
        return [];
      }
      const res = await API.get(`/groups?search=${encodeURIComponent(query)}`);
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to search groups",
      );
    }
  },
);

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
    members: [],
    groupBalances: null,
    balancesLoading: false,
    loading: false,
    searchResults: [],
    searchLoading: false,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(getGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(getGroups.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getGroupDetails.pending, (state) => {
        state.groupBalances = null;
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        state.selectedGroup = action.payload;
      })
      .addCase(getGroupMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.unshift(action.payload);
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter(
          (m) => m.userId !== action.payload,
        );
      })
      .addCase(getGroupBalances.pending, (state) => {
        state.balancesLoading = true;
      })
      .addCase(getGroupBalances.fulfilled, (state, action) => {
        state.balancesLoading = false;
        state.groupBalances = action.payload;
      })
      .addCase(getGroupBalances.rejected, (state) => {
        state.balancesLoading = false;
        state.groupBalances = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g.groupId !== action.payload);
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g.groupId !== action.payload);
      })
      .addCase(searchGroups.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchGroups.rejected, (state) => {
        state.searchLoading = false;
        state.searchResults = [];
      });
  },
});

export const { clearSearchResults } = groupSlice.actions;
export default groupSlice.reducer;
