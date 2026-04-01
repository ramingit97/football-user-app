import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const stadiumsApi = createApi({
    reducerPath: 'stadiumsApi',
    tagTypes: ['MyStadiums'],
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/stadiums`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getStadiums: builder.query({
            query: (params) => {
                if (params && params.district) {
                    return `?district=${params.district}`;
                }
                return '/';
            },
        }),
        getStadiumSlots: builder.query({
            query: ({ stadiumId, date }) => `/${stadiumId}/available-slots?date=${date}`,
        }),
        getMyStadiums: builder.query({
            query: (ownerId) => `/owner/${ownerId}`,
            providesTags: ['MyStadiums'],
        }),
        suggestStadium: builder.mutation({
            query: (body) => ({ url: '/', method: 'POST', body }),
            invalidatesTags: ['MyStadiums'],
        }),
    }),
});

export const {
    useGetStadiumsQuery,
    useGetStadiumSlotsQuery,
    useLazyGetStadiumsQuery,
    useLazyGetStadiumSlotsQuery,
    useGetMyStadiumsQuery,
    useSuggestStadiumMutation,
} = stadiumsApi;
