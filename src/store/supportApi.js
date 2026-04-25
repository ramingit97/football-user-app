import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const supportApi = createApi({
    reducerPath: 'supportApi',
    tagTypes: ['Tickets'],
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api/support`),
    endpoints: (builder) => ({
        getMyTickets: builder.query({
            query: (userId) => `/my?userId=${userId}`,
            providesTags: ['Tickets'],
        }),
        createTicket: builder.mutation({
            query: (body) => ({ url: '/', method: 'POST', body }),
            invalidatesTags: ['Tickets'],
        }),
        markTicketsSeen: builder.mutation({
            query: (userId) => ({ url: `/my/seen?userId=${userId}`, method: 'PATCH' }),
            invalidatesTags: ['Tickets'],
        }),
    }),
});

export const { useGetMyTicketsQuery, useCreateTicketMutation, useMarkTicketsSeenMutation } = supportApi;
