import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const tournamentsApi = createApi({
    reducerPath: 'tournamentsApi',
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api`),
    tagTypes: ['Tournament'],
    endpoints: (builder) => ({
        getTournaments: builder.query({
            query: ({ page = 1, limit = 20, status } = {}) => {
                const p = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (status) p.append('status', status);
                return `tournaments?${p.toString()}`;
            },
            providesTags: ['Tournament'],
        }),
        getTournamentById: builder.query({
            query: (id) => `tournaments/${id}`,
            providesTags: ['Tournament'],
        }),
        getTournamentStandings: builder.query({
            query: (id) => `tournaments/${id}/standings`,
            providesTags: ['Tournament'],
        }),
        getTournamentBracket: builder.query({
            query: (id) => `tournaments/${id}/bracket`,
            providesTags: ['Tournament'],
        }),
        getTournamentSlots: builder.query({
            query: (id) => `tournaments/${id}/slots`,
            providesTags: ['Tournament'],
        }),
        createTournament: builder.mutation({
            query: (body) => ({ url: 'tournaments', method: 'POST', body }),
            invalidatesTags: ['Tournament'],
        }),
        registerTeam: builder.mutation({
            query: ({ tournamentId, teamId }) => ({
                url: `tournaments/${tournamentId}/register`,
                method: 'POST',
                body: { teamId },
            }),
            invalidatesTags: ['Tournament'],
        }),
        unregisterTeam: builder.mutation({
            query: ({ tournamentId, teamId }) => ({
                url: `tournaments/${tournamentId}/unregister/${teamId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Tournament'],
        }),
        startGroupDraw: builder.mutation({
            query: (tournamentId) => ({ url: `tournaments/${tournamentId}/start-draw`, method: 'POST' }),
            invalidatesTags: ['Tournament'],
        }),
        startPlayoffDraw: builder.mutation({
            query: (tournamentId) => ({ url: `tournaments/${tournamentId}/start-playoff-draw`, method: 'POST' }),
            invalidatesTags: ['Tournament'],
        }),
        addSlot: builder.mutation({
            query: ({ tournamentId, ...body }) => ({
                url: `tournaments/${tournamentId}/slots`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Tournament'],
        }),
        deleteSlot: builder.mutation({
            query: ({ tournamentId, slotId }) => ({
                url: `tournaments/${tournamentId}/slots/${slotId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Tournament'],
        }),
        proposeSlot: builder.mutation({
            query: ({ tournamentId, matchId, slotId }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/propose-slot`,
                method: 'POST',
                body: { slotId },
            }),
            invalidatesTags: ['Tournament'],
        }),
        respondToSlot: builder.mutation({
            query: ({ tournamentId, matchId, accept }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/respond-slot`,
                method: 'POST',
                body: { accept },
            }),
            invalidatesTags: ['Tournament'],
        }),
        enterScore: builder.mutation({
            query: ({ tournamentId, matchId, homeScore, awayScore, winnerId }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/score`,
                method: 'POST',
                body: { homeScore, awayScore, winnerId },
            }),
            invalidatesTags: ['Tournament'],
        }),
        assignWalkover: builder.mutation({
            query: ({ tournamentId, matchId, winnerTeamId }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/walkover`,
                method: 'POST',
                body: { winnerTeamId },
            }),
            invalidatesTags: ['Tournament'],
        }),
        cancelTournament: builder.mutation({
            query: (tournamentId) => ({ url: `tournaments/${tournamentId}/cancel`, method: 'POST' }),
            invalidatesTags: ['Tournament'],
        }),
        getTournamentStats: builder.query({
            query: (id) => `tournaments/${id}/stats`,
            providesTags: ['Tournament'],
        }),
        getRoster: builder.query({
            query: ({ tournamentId, teamId }) => `tournaments/${tournamentId}/teams/${teamId}/roster`,
            providesTags: ['Tournament'],
        }),
        addRosterPlayer: builder.mutation({
            query: ({ tournamentId, teamId, ...body }) => ({
                url: `tournaments/${tournamentId}/teams/${teamId}/roster`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Tournament'],
        }),
        removeRosterPlayer: builder.mutation({
            query: ({ tournamentId, teamId, playerId }) => ({
                url: `tournaments/${tournamentId}/teams/${teamId}/roster/${playerId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Tournament'],
        }),
        claimRosterPlayer: builder.mutation({
            query: ({ tournamentId, playerId }) => ({
                url: `tournaments/${tournamentId}/roster/${playerId}/claim`,
                method: 'POST',
            }),
            invalidatesTags: ['Tournament'],
        }),
        approveRosterClaim: builder.mutation({
            query: ({ tournamentId, playerId, approve }) => ({
                url: `tournaments/${tournamentId}/roster/${playerId}/approve-claim`,
                method: 'POST',
                body: { approve },
            }),
            invalidatesTags: ['Tournament'],
        }),
        getMatch: builder.query({
            query: ({ tournamentId, matchId }) => `tournaments/${tournamentId}/matches/${matchId}`,
            providesTags: ['Tournament'],
        }),
        enterMatchStats: builder.mutation({
            query: ({ tournamentId, matchId, playerStats }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/stats`,
                method: 'POST',
                body: { playerStats },
            }),
            invalidatesTags: ['Tournament'],
        }),
        voteMvp: builder.mutation({
            query: ({ tournamentId, matchId, playerId }) => ({
                url: `tournaments/${tournamentId}/matches/${matchId}/mvp-vote`,
                method: 'POST',
                body: { playerId },
            }),
            invalidatesTags: ['Tournament'],
        }),
    }),
});

export const {
    useGetTournamentsQuery,
    useGetTournamentByIdQuery,
    useGetTournamentStandingsQuery,
    useGetTournamentBracketQuery,
    useGetTournamentSlotsQuery,
    useCreateTournamentMutation,
    useRegisterTeamMutation,
    useUnregisterTeamMutation,
    useStartGroupDrawMutation,
    useStartPlayoffDrawMutation,
    useAddSlotMutation,
    useDeleteSlotMutation,
    useProposeSlotMutation,
    useRespondToSlotMutation,
    useEnterScoreMutation,
    useAssignWalkoverMutation,
    useCancelTournamentMutation,
    useGetTournamentStatsQuery,
    useGetRosterQuery,
    useAddRosterPlayerMutation,
    useRemoveRosterPlayerMutation,
    useClaimRosterPlayerMutation,
    useApproveRosterClaimMutation,
    useGetMatchQuery,
    useEnterMatchStatsMutation,
    useVoteMvpMutation,
} = tournamentsApi;
