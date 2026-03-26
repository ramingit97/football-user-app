import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const stadiumsApi = createApi({
    reducerPath: 'stadiumsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/stadiums`, // Direct to stadium-service
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
                // params might be { district: 'Yasymal' }
                if (params && params.district) {
                    return `?district=${params.district}`;
                }
                return '/';
            },
        }),
        getStadiumSlots: builder.query({
            query: ({ stadiumId, date }) => `/${stadiumId}/available-slots?date=${date}`,
        }),
    }),
});

export const { useGetStadiumsQuery, useGetStadiumSlotsQuery, useLazyGetStadiumsQuery, useLazyGetStadiumSlotsQuery } = stadiumsApi;
