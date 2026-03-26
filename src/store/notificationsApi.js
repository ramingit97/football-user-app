import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';

export const notificationsApi = createApi({
    reducerPath: 'notificationsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE}/api/notifications`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Notifications'],
    endpoints: (builder) => ({
        getMyNotifications: builder.query({
            query: (userId) => `/my?userId=${userId}`,
            providesTags: ['Notifications'],
        }),
        sendNotification: builder.mutation({
            query: (body) => ({
                url: '/send',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAsRead: builder.mutation({
            query: (id) => ({
                url: `/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAllAsRead: builder.mutation({
            queryFn: async (ids, _api, _opts, baseQuery) => {
                await Promise.all(ids.map(id => baseQuery({ url: `/${id}/read`, method: 'PATCH' })));
                return { data: { success: true } };
            },
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetMyNotificationsQuery,
    useSendNotificationMutation,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = notificationsApi;
