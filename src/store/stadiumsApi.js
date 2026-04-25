import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const stadiumsApi = createApi({
    reducerPath: 'stadiumsApi',
    tagTypes: ['MyStadiums'],
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api/stadiums`),
    endpoints: (builder) => ({
        getStadiums: builder.query({
            query: (params) => {
                if (params && params.district) {
                    return `?district=${params.district}`;
                }
                return '/';
            },
        }),
        getStadiumById: builder.query({
            query: (id) => `/${id}`,
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
        createBooking: builder.mutation({
            query: (body) => ({
                url: `${API_BASE}/api/bookings`,
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetStadiumsQuery,
    useGetStadiumByIdQuery,
    useGetStadiumSlotsQuery,
    useLazyGetStadiumsQuery,
    useLazyGetStadiumSlotsQuery,
    useGetMyStadiumsQuery,
    useSuggestStadiumMutation,
    useCreateBookingMutation,
} = stadiumsApi;
