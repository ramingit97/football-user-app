import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const authApi = createApi({
    reducerPath: 'authApi',
    tagTypes: ['User', 'Friends', 'Referral'],
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/auth`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: 'login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: 'register',
                method: 'POST',
                body: userData,
            }),
        }),
        loginWithPhone: builder.mutation({
            query: (idToken) => ({
                url: 'login-phone',
                method: 'POST',
                body: { idToken },
            }),
        }),
        loginWithGoogle: builder.mutation({
            query: (idToken) => ({
                url: 'login-google',
                method: 'POST',
                body: { idToken },
            }),
        }),
        getProfile: builder.query({
            query: () => 'profile',
            providesTags: ['User'],
        }),
        searchUsers: builder.query({
            query: ({ query, page = 1, limit = 10 }) => ({
                url: `${API_BASE}/api/users/search/query`,
                params: { q: query, page, limit }
            }),
        }),
        getUserById: builder.query({
            query: (userId) => {
                const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
                return `${base}/api/users/${userId}`;
            },
        }),
        updateProfile: builder.mutation({
            query: (profileData) => ({
                url: 'profile',
                method: 'PUT',
                body: profileData,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.mutation({
            query: () => ({
                url: 'logout',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
        submitRating: builder.mutation({
            query: (data) => ({
                url: 'ratings',
                method: 'POST',
                body: data,
            }),
        }),
        transferBalance: builder.mutation({
            query: ({ senderId, receiverId, amount, note }) => ({
                url: `${API_BASE}/api/users/transfer`,
                method: 'POST',
                body: { senderId, receiverId, amount, note },
            }),
            invalidatesTags: ['User'],
        }),
        getTransactions: builder.query({
            query: (userId) => `${API_BASE}/api/users/${userId}/transactions`,
        }),
        // Friends
        sendFriendRequest: builder.mutation({
            query: ({ requesterId, receiverId }) => ({
                url: `${API_BASE}/api/users/friends/request`,
                method: 'POST',
                body: { requesterId, receiverId },
            }),
            invalidatesTags: ['Friends'],
        }),
        respondToFriendRequest: builder.mutation({
            query: ({ requestId, status }) => ({
                url: `${API_BASE}/api/users/friends/respond`,
                method: 'POST',
                body: { requestId, status },
            }),
            invalidatesTags: ['Friends'],
        }),
        getFriends: builder.query({
            query: (userId) => `${API_BASE}/api/users/${userId}/friends`,
            providesTags: ['Friends'],
        }),
        getFriendRequests: builder.query({
            query: (userId) => `${API_BASE}/api/users/${userId}/friend-requests`,
            providesTags: ['Friends'],
        }),
        getFriendshipStatus: builder.query({
            query: ({ userId, targetId }) => `${API_BASE}/api/users/${userId}/friend-status/${targetId}`,
            providesTags: ['Friends'],
        }),
        removeFriend: builder.mutation({
            query: ({ userId, targetId }) => ({
                url: `${API_BASE}/api/users/${userId}/friends/${targetId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Friends'],
        }),
        getReferralInfo: builder.query({
            query: (userId) => `${API_BASE}/api/users/${userId}/referral`,
            providesTags: ['Referral'],
        }),
        processReferral: builder.mutation({
            query: ({ userId, referralCode }) => ({
                url: `${API_BASE}/api/users/${userId}/process-referral`,
                method: 'POST',
                body: { referralCode },
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useLogoutMutation,
    useSubmitRatingMutation,
    useLazySearchUsersQuery,
    useLazyGetUserByIdQuery,
    useGetUserByIdQuery,
    useLoginWithPhoneMutation,
    useLoginWithGoogleMutation,
    useTransferBalanceMutation,
    useGetTransactionsQuery,
    useSendFriendRequestMutation,
    useRespondToFriendRequestMutation,
    useGetFriendsQuery,
    useGetFriendRequestsQuery,
    useGetFriendshipStatusQuery,
    useRemoveFriendMutation,
    useGetReferralInfoQuery,
    useProcessReferralMutation,
} = authApi;

