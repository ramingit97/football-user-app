import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const locationsApi = createApi({
    reducerPath: 'locationsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api`,
    }),
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
