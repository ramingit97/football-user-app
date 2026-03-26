import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const teamsApi = createApi({
    reducerPath: 'teamsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/teams`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Teams', 'TeamRequests', 'Challenges'],
    endpoints: (builder) => ({
        getTeams: builder.query({
            query: (filters = {}) => {
                const params = new URLSearchParams();
                if (filters.minRating) params.append('minRating', filters.minRating);
                if (filters.maxRating) params.append('maxRating', filters.maxRating);
                if (filters.page) params.append('page', filters.page);
                if (filters.limit) params.append('limit', filters.limit);
                if (filters.sortBy) params.append('sortBy', filters.sortBy);
                if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
                return `/?${params.toString()}`;
            },
            providesTags: ['Teams'],
        }),
        getMyTeams: builder.query({
            query: (userId) => `/my?userId=${userId}`,
            providesTags: ['Teams'],
        }),
        getTeamById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: 'Teams', id }],
        }),
        createTeam: builder.mutation({
            query: (body) => ({
                url: '/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Teams'],
        }),
        joinTeam: builder.mutation({
            query: ({ teamId, userId }) => ({
                url: `/${teamId}/join`,
                method: 'POST',
                body: { userId },
            }),
            invalidatesTags: ['Teams'],
        }),
        leaveTeam: builder.mutation({
            query: ({ teamId, userId }) => ({
                url: `/${teamId}/leave`,
                method: 'DELETE',
                body: { userId },
            }),
            invalidatesTags: ['Teams'],
        }),
        requestJoin: builder.mutation({
            query: ({ teamId, userId }) => ({
                url: `/${teamId}/join-request`,
                method: 'POST',
                body: { userId },
            }),
            invalidatesTags: ['Teams'],
        }),
        getTeamRequests: builder.query({
            query: (teamId) => `/${teamId}/requests`,
            providesTags: ['TeamRequests'],
        }),
        respondToRequest: builder.mutation({
            query: ({ requestId, status }) => ({
                url: `/requests/${requestId}/respond`,
                method: 'POST',
                body: { status },
            }),
            invalidatesTags: ['Teams', 'TeamRequests'],
        }),
        transferCaptain: builder.mutation({
            query: ({ id, newCaptainId, currentUserId }) => ({
                url: `/${id}/captain`,
                method: 'PUT',
                body: { newCaptainId, currentUserId },
            }),
            invalidatesTags: ['Teams'],
        }),
        updateFormation: builder.mutation({
            query: ({ teamId, formation, currentUserId }) => ({
                url: `/${teamId}/formation`,
                method: 'PUT',
                body: { formation, currentUserId },
            }),
            invalidatesTags: ['Teams'],
        }),
        updateFormationByFormat: builder.mutation({
            query: ({ teamId, gameFormat, formationString, players, currentUserId }) => ({
                url: `/${teamId}/formation/${gameFormat}`,
                method: 'PUT',
                body: { formationString, players, currentUserId },
            }),
            invalidatesTags: ['Teams'],
        }),
        getFormationByFormat: builder.query({
            query: ({ teamId, gameFormat }) => `/${teamId}/formation/${gameFormat}`,
            providesTags: (result, error, { teamId, gameFormat }) => [{ type: 'Teams', id: `${teamId}-${gameFormat}` }],
        }),
        updateFlag: builder.mutation({
            query: ({ teamId, flagUrl, currentUserId }) => ({
                url: `/${teamId}/flag`,
                method: 'PUT',
                body: { flagUrl, currentUserId },
            }),
            invalidatesTags: ['Teams'],
        }),
        updateReservePlayers: builder.mutation({
            query: ({ teamId, reservePlayerIds, currentUserId }) => ({
                url: `/${teamId}/reserves`,
                method: 'PUT',
                body: { reservePlayerIds, currentUserId },
            }),
            invalidatesTags: ['Teams'],
        }),
        updateMatchResult: builder.mutation({
            query: ({ winnerId, loserId, isDraw }) => ({
                url: '/match-result',
                method: 'POST',
                body: { winnerId, loserId, isDraw },
            }),
            invalidatesTags: ['Teams'],
        }),
        createChallenge: builder.mutation({
            query: (body) => ({
                url: '/../challenges',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Challenges'],
        }),
        getChallengesByTeam: builder.query({
            query: (teamId) => `/../challenges/team/${teamId}`,
            providesTags: ['Challenges'],
        }),
        respondToChallenge: builder.mutation({
            query: ({ id, status }) => ({
                url: `/../challenges/${id}/respond`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Challenges'],
        }),
    }),
});

export const {
    useGetTeamsQuery,
    useGetMyTeamsQuery,
    useGetTeamByIdQuery,
    useCreateTeamMutation,
    useJoinTeamMutation,
    useLeaveTeamMutation,
    useRequestJoinMutation,
    useGetTeamRequestsQuery,
    useRespondToRequestMutation,
    useTransferCaptainMutation,
    useUpdateFormationMutation,
    useUpdateFormationByFormatMutation,
    useLazyGetFormationByFormatQuery,
    useUpdateFlagMutation,
    useUpdateReservePlayersMutation,
    useUpdateMatchResultMutation,
    useCreateChallengeMutation,
    useGetChallengesByTeamQuery,
    useRespondToChallengeMutation,
} = teamsApi;

