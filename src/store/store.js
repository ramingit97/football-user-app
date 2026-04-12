import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './authApi';
import { gamesApi } from './gamesApi';
import { teamsApi } from './teamsApi';
import { notificationsApi } from './notificationsApi';
import { paymentsApi } from './paymentsApi';
import { locationsApi } from './locationsApi';
import { stadiumsApi } from './stadiumsApi';
import { supportApi } from './supportApi';
import { elanlarApi } from './elanlarApi';
import { tournamentsApi } from './tournamentsApi';
import authReducer from './authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [gamesApi.reducerPath]: gamesApi.reducer,
        [teamsApi.reducerPath]: teamsApi.reducer,
        [notificationsApi.reducerPath]: notificationsApi.reducer,
        [paymentsApi.reducerPath]: paymentsApi.reducer,
        [locationsApi.reducerPath]: locationsApi.reducer,
        [stadiumsApi.reducerPath]: stadiumsApi.reducer,
        [supportApi.reducerPath]: supportApi.reducer,
        [elanlarApi.reducerPath]: elanlarApi.reducer,
        [tournamentsApi.reducerPath]: tournamentsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            gamesApi.middleware,
            teamsApi.middleware,
            notificationsApi.middleware,
            paymentsApi.middleware,
            locationsApi.middleware,
            stadiumsApi.middleware,
            supportApi.middleware,
            elanlarApi.middleware,
            tournamentsApi.middleware,
        ),
});

setupListeners(store.dispatch);

export * from './authSlice';

