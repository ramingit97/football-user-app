import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const gamesApi = createApi({
    reducerPath: 'gamesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Game', 'TeamRequest'],
    endpoints: (builder) => ({
        getHotGames: builder.query({
            query: () => '/games/hot',
            providesTags: ['Game'],
        }),
        getLeaderboard: builder.query({
            query: () => '/games/leaderboard',
        }),
        getGamesByUser: builder.query({
            query: (userId) => `/games/user/${userId}`,
            providesTags: ['Game'],
        }),
        getGames: builder.query({
            query: ({ page = 1, limit = 12, status, format, district, metro } = {}) => {
                const params = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (status) params.append('status', status);
                if (format) params.append('format', format);
                if (district) params.append('district', district);
                if (metro) params.append('metro', metro);
                return `games?${params.toString()}`;
            },
            providesTags: ['Game'],
        }),
        getGamesByTeam: builder.query({
            query: (teamId) => `games/team/${teamId}`,
            providesTags: ['Game'],
        }),
        getNearbyGames: builder.query({
            query: ({ lat, lng, radius }) => `games/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
            providesTags: ['Game'],
        }),
        getGameById: builder.query({
            query: (id) => `games/${id}`,
            providesTags: (result, error, id) => [{ type: 'Game', id }],
        }),
        createGame: builder.mutation({
            query: (gameData) => ({
                url: 'games',
                method: 'POST',
                body: gameData,
            }),
            invalidatesTags: ['Game'],

        }),
        updateGame: builder.mutation({
            query: ({ id, data }) => ({
                url: `games/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),
        joinGame: builder.mutation({
            query: ({ id, player }) => ({
                url: `games/${id}/join`,
                method: 'POST',
                body: player,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),
        finishGame: builder.mutation({
            query: ({ id, data }) => ({
                url: `games/${id}/finish`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),
        leaveGame: builder.mutation({
            query: ({ id, playerId }) => ({
                url: `games/${id}/leave`,
                method: 'POST',
                body: { playerId },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),
        cancelGame: builder.mutation({
            query: ({ id, organizerId, reason }) => ({
                url: `games/${id}/cancel`,
                method: 'POST',
                body: { organizerId, reason },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),
        getMyTeamRequests: builder.query({
            query: (userId) => `teams/requests/my?userId=${userId}`,
            providesTags: ['TeamRequest'],
        }),
        respondToTeamRequest: builder.mutation({
            query: ({ requestId, status }) => ({
                url: `teams/requests/${requestId}/respond`,
                method: 'POST',
                body: { status },
            }),
            invalidatesTags: ['TeamRequest'],
        }),
        invitePlayer: builder.mutation({
            query: ({ teamId, userId }) => ({
                url: `teams/${teamId}/invite`,
                method: 'POST',
                body: { userId },
            }),
        }),
        smartInvite: builder.mutation({
            query: ({ id, filters }) => ({
                url: `games/${id}/smart-invite`,
                method: 'POST',
                body: filters,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'GameInvite', id }],
        }),
        getGameInvites: builder.query({
            query: (id) => `games/${id}/invites`,
            providesTags: (result, error, id) => [{ type: 'GameInvite', id }],
        }),

        // ============ POST-GAME PHASE FLOW ============

        // Step 1: Organizer enters score only
        startFinishGame: builder.mutation({
            query: ({ id, scoreTeamA, scoreTeamB }) => ({
                url: `games/${id}/start-finish`,
                method: 'POST',
                body: { scoreTeamA, scoreTeamB },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),

        // Step 2: Player claims their stats
        claimStats: builder.mutation({
            query: ({ id, playerId, goals, assists }) => ({
                url: `games/${id}/claim-stats`,
                method: 'POST',
                body: { playerId, goals, assists },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),

        // Get pending stats for organizer review
        getPendingStats: builder.query({
            query: (id) => `games/${id}/pending-stats`,
            providesTags: (result, error, id) => [{ type: 'Game', id }],
        }),

        // Step 3: Organizer validates stats
        validateStats: builder.mutation({
            query: ({ id, organizerId, stats }) => ({
                url: `games/${id}/validate-stats`,
                method: 'POST',
                body: { organizerId, stats },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),

        // Step 4: Player casts MVP vote
        castMvpVote: builder.mutation({
            query: ({ id, voterId, votedPlayerId }) => ({
                url: `games/${id}/cast-mvp-vote`,
                method: 'POST',
                body: { voterId, votedPlayerId },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),

        // Step 5: Complete game
        completeGame: builder.mutation({
            query: (id) => ({
                url: `games/${id}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Game', id }],
        }),

        // ============ UNIFIED POST-GAME (SIMPLIFIED) ============
        submitPostGame: builder.mutation({
            query: ({ id, playerId, goals, assists, mvpVoteId, badges }) => ({
                url: `games/${id}/submit-postgame`,
                method: 'POST',
                body: { playerId, goals, assists, mvpVoteId, badges },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Game', id }],
        }),

        balanceTeams: builder.mutation({
            query: (id) => ({
                url: `games/${id}/balance-teams`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Game', id }],
        }),
        sendPrivateInvites: builder.mutation({
            query: ({ id, playerIds }) => ({
                url: `games/${id}/private-invite`,
                method: 'POST',
                body: { playerIds },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'GameInvite', id }],
        }),
    }),
});

export const {
    useGetHotGamesQuery,
    useGetLeaderboardQuery,
    useGetGamesByUserQuery,
    useGetGamesQuery,
    useGetGamesByTeamQuery,
    useGetNearbyGamesQuery,
    useGetGameByIdQuery,
    useCreateGameMutation,
    useUpdateGameMutation,
    useJoinGameMutation,
    useFinishGameMutation,
    useLeaveGameMutation,
    useGetMyTeamRequestsQuery,
    useRespondToTeamRequestMutation,
    useInvitePlayerMutation,
    useSmartInviteMutation,
    useSendPrivateInvitesMutation,
    useGetGameInvitesQuery,
    // Post-game flow hooks
    useStartFinishGameMutation,
    useClaimStatsMutation,
    useGetPendingStatsQuery,
    useValidateStatsMutation,
    useCastMvpVoteMutation,
    useCompleteGameMutation,
    // Unified post-game
    useSubmitPostGameMutation,
    useBalanceTeamsMutation,
    useCancelGameMutation,
} = gamesApi;


