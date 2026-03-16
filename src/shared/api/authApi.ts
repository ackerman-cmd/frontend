import { baseApi } from './baseApi';
import type { RegisterRequest, UserResponse } from '../../entities/user/model/types';
import {
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_TOKEN_URL,
  CODE_VERIFIER_KEY,
} from '../lib/constants';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<UserResponse, RegisterRequest>({
      query: (body) => ({
        url: '/api/v1/auth/register',
        method: 'POST',
        body,
      }),
    }),

    verifyEmail: builder.query<UserResponse, string>({
      query: (token) => ({
        url: '/api/v1/auth/verify',
        params: { token },
      }),
    }),

    exchangeCodeForToken: builder.mutation<
      TokenResponse,
      { code: string; state?: string }
    >({
      query: ({ code }) => {
        const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
        if (!codeVerifier) {
          throw new Error(
            'PKCE code_verifier не найден в sessionStorage. ' +
              'Убедитесь, что вход был инициирован через нашу страницу /login.'
          );
        }

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: OAUTH_REDIRECT_URI,
          client_id: OAUTH_CLIENT_ID,
          code_verifier: codeVerifier,
        });

        return {
          url: OAUTH_TOKEN_URL,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        };
      },
    }),
    serverLogout: builder.mutation<void, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: '/api/v1/auth/logout',
          method: 'POST',
          credentials: 'include',
        });
        return result.error ? { error: result.error } : { data: undefined };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterMutation,
  useVerifyEmailQuery,
  useExchangeCodeForTokenMutation,
  useServerLogoutMutation,
} = authApi;
