import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const loadFriendsHub = createAsyncThunk(
  "user/loadFriendsHub",
  async (_, { rejectWithValue }) => {
    try {
      const [reqRes, friendsRes] = await Promise.all([
        API.get("/users/friend-requests"),
        API.get("/users/friends/list"),
      ]);
      const data = reqRes.data?.data || {};
      return {
        sent: data.sent || [],
        received: data.received || [],
        pendingIncomingCount:
          data.pendingIncomingCount ?? (data.received || []).length,
        friends: friendsRes.data?.data || [],
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load friends",
      );
    }
  },
);

export const respondFriendRequest = createAsyncThunk(
  "user/respondFriendRequest",
  async ({ requestId, action }, { rejectWithValue, dispatch }) => {
    try {
      await API.post("/users/respond-request", { requestId, action });
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not update request",
      );
    }
    try {
      await dispatch(loadFriendsHub()).unwrap();
    } catch {
      /* non-fatal refresh failure */
    }
    return { requestId, action };
  },
);

export const removeFriendByUsername = createAsyncThunk(
  "user/removeFriendByUsername",
  async (username, { rejectWithValue, dispatch }) => {
    try {
      await API.delete(
        `/users/remove-friend/${encodeURIComponent(username)}`,
      );
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not remove friend",
      );
    }
    try {
      await dispatch(loadFriendsHub()).unwrap();
    } catch {
      /* non-fatal */
    }
    return username;
  },
);

export const searchUsers = createAsyncThunk(
  "user/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      if (!query.trim()) {
        return [];
      }
      const res = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to search users",
      );
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    searchResults: [],
    searchLoading: false,
    searchError: null,
    friendsList: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    pendingIncomingCount: 0,
    friendsHubLoading: false,
    friendsHubError: null,
    friendActionLoading: false,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    updatePendingIncomingCount: (state, action) => {
      state.pendingIncomingCount =
        typeof action.payload === "number" ? action.payload : 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
        state.searchResults = [];
      })

      .addCase(loadFriendsHub.pending, (state) => {
        state.friendsHubLoading = true;
        state.friendsHubError = null;
      })
      .addCase(loadFriendsHub.fulfilled, (state, action) => {
        state.friendsHubLoading = false;
        state.friendsList = action.payload.friends;
        state.friendRequestsSent = action.payload.sent;
        state.friendRequestsReceived = action.payload.received;
        state.pendingIncomingCount = action.payload.pendingIncomingCount;
      })
      .addCase(loadFriendsHub.rejected, (state, action) => {
        state.friendsHubLoading = false;
        state.friendsHubError = action.payload;
      })

      .addCase(respondFriendRequest.pending, (state) => {
        state.friendActionLoading = true;
      })
      .addCase(respondFriendRequest.fulfilled, (state) => {
        state.friendActionLoading = false;
      })
      .addCase(respondFriendRequest.rejected, (state) => {
        state.friendActionLoading = false;
      })

      .addCase(removeFriendByUsername.pending, (state) => {
        state.friendActionLoading = true;
      })
      .addCase(removeFriendByUsername.fulfilled, (state) => {
        state.friendActionLoading = false;
      })
      .addCase(removeFriendByUsername.rejected, (state) => {
        state.friendActionLoading = false;
      });
  },
});

export const { clearSearchResults, updatePendingIncomingCount } =
  userSlice.actions;
export default userSlice.reducer;
