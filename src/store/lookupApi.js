import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const lookupApi = createApi({
    reducerPath: 'lookupApi',
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api`),
    tagTypes: ['Lookup'],
    endpoints: (builder) => ({
        getLookups: builder.query({
            query: (params = {}) => {
                const q = new URLSearchParams();
                if (params.format) q.set('format', params.format);
                if (params.district) q.set('district', params.district);
                if (params.status) q.set('status', params.status);
                const qs = q.toString();
                return `/lookup${qs ? '?' + qs : ''}`;
            },
            providesTags: ['Lookup'],
        }),
        getLookup: builder.query({
            query: (id) => `/lookup/${id}`,
            providesTags: (result, error, id) => [{ type: 'Lookup', id }],
        }),
        createLookup: builder.mutation({
            query: (body) => ({ url: '/lookup', method: 'POST', body }),
            invalidatesTags: ['Lookup'],
        }),
        respondToLookup: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/lookup/${id}/respond`, method: 'POST', body }),
            invalidatesTags: (r, e, { id }) => [{ type: 'Lookup', id }, 'Lookup'],
        }),
        updateLookupStatus: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/lookup/${id}/status`, method: 'PATCH', body }),
            invalidatesTags: ['Lookup'],
        }),
        getLookupMessages: builder.query({
            query: (id) => `/lookup/${id}/messages`,
            providesTags: (result, error, id) => [{ type: 'Lookup', id }],
        }),
        sendLookupMessage: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/lookup/${id}/messages`, method: 'POST', body }),
            invalidatesTags: (r, e, { id }) => [{ type: 'Lookup', id }],
        }),
    }),
});

export const {
    useGetLookupsQuery,
    useGetLookupQuery,
    useCreateLookupMutation,
    useRespondToLookupMutation,
    useUpdateLookupStatusMutation,
    useGetLookupMessagesQuery,
    useSendLookupMessageMutation,
} = lookupApi;
