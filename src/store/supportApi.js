import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const supportApi = createApi({
    reducerPath: 'supportApi',
    tagTypes: ['Tickets'],
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/support`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
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
