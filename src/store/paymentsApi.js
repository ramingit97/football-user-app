import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const paymentsApi = createApi({
    reducerPath: 'paymentsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/payments`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        processPayment: builder.mutation({
            query: (body) => ({
                url: '/pay',
                method: 'POST',
                body,
            }),
        }),
        refundPayment: builder.mutation({
            query: (body) => ({
                url: '/refund',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useProcessPaymentMutation,
    useRefundPaymentMutation,
} = paymentsApi;
