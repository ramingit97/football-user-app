import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const elanlarApi = createApi({
    reducerPath: 'elanlarApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['Elan'],
    endpoints: (builder) => ({
        getElanlar: builder.query({
            query: () => '/elanlar',
            providesTags: ['Elan'],
        }),
        getElan: builder.query({
            query: (id) => `/elanlar/${id}`,
            providesTags: (result, error, id) => [{ type: 'Elan', id }],
        }),
        createElan: builder.mutation({
            query: (body) => ({ url: '/elanlar', method: 'POST', body }),
            invalidatesTags: ['Elan'],
        }),
        toggleInterest: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/elanlar/${id}/interest`, method: 'POST', body }),
            invalidatesTags: ['Elan'],
        }),
        cancelElan: builder.mutation({
            query: ({ id, userId }) => ({ url: `/elanlar/${id}`, method: 'DELETE', body: { userId } }),
            invalidatesTags: ['Elan'],
        }),
        voteTime: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/elanlar/${id}/vote`, method: 'POST', body }),
            invalidatesTags: (r, e, { id }) => [{ type: 'Elan', id }],
        }),
        convertElan: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/elanlar/${id}/convert`, method: 'POST', body }),
            invalidatesTags: ['Elan'],
        }),
        getElanMessages: builder.query({
            query: (id) => `/elanlar/${id}/messages`,
        }),
    }),
});

export const {
    useGetElanlarQuery,
    useGetElanQuery,
    useCreateElanMutation,
    useToggleInterestMutation,
    useCancelElanMutation,
    useVoteTimeMutation,
    useConvertElanMutation,
    useGetElanMessagesQuery,
} = elanlarApi;
