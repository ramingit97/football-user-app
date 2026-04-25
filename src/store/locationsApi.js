import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const locationsApi = createApi({
    reducerPath: 'locationsApi',
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api`),
    tagTypes: ['District', 'Metro'],
    endpoints: (builder) => ({
        getDistricts: builder.query({
            query: () => 'locations/districts',
            providesTags: ['District'],
        }),
        getMetroStations: builder.query({
            query: () => 'locations/metro',
            providesTags: ['Metro'],
        }),
    }),
});

export const {
    useGetDistrictsQuery,
    useGetMetroStationsQuery,
} = locationsApi;
