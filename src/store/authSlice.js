import { createSlice } from '@reduxjs/toolkit';

const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();

const initialState = {
    user: storedUser || null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, refreshToken } = action.payload;
            if (user !== undefined) state.user = user;
            if (token !== undefined) {
                state.token = token;
                if (token) localStorage.setItem('token', token);
            }
            if (refreshToken !== undefined) {
                state.refreshToken = refreshToken;
                if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
            }
            if (user) localStorage.setItem('user', JSON.stringify(user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
