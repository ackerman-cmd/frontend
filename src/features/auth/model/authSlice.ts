import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN_KEY } from '../../../shared/lib/constants';

export interface JwtClaims {
  user_id: string;
  email: string;
  roles: string[];
  permissions: string[];
  status: string;
  exp: number;
  sub: string;
}

interface AuthState {
  token: string | null;
  user: JwtClaims | null;
  isAuthenticated: boolean;
}

function restoreSession(): { token: string; user: JwtClaims } | null {
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!stored) return null;
  try {
    const claims = jwtDecode<JwtClaims>(stored);
    if (claims.exp * 1000 < Date.now()) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return null;
    }
    return { token: stored, user: claims };
  } catch {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return null;
  }
}

const session = restoreSession();

const initialState: AuthState = {
  token: session?.token ?? null,
  user:  session?.user ?? null,
  isAuthenticated: session !== null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<string>) => {
      const token = action.payload;
      state.token = token;
      state.user = jwtDecode<JwtClaims>(token);
      state.isAuthenticated = true;
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    },
    _syncFromStorage: (state, action: PayloadAction<string | null>) => {
      const token = action.payload;
      if (!token) {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      } else {
        try {
          const claims = jwtDecode<JwtClaims>(token);
          if (claims.exp * 1000 >= Date.now()) {
            state.token = token;
            state.user = claims;
            state.isAuthenticated = true;
          }
        } catch { }
      }
    },
  },
});

export const { setCredentials, logout, _syncFromStorage } = authSlice.actions;
export default authSlice.reducer;
