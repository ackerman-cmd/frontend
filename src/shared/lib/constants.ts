export const API_BASE_URL =
  process.env.REACT_APP_API_URL ?? 'http://localhost:8080';

export const CRM_API_BASE_URL =
  process.env.REACT_APP_CRM_API_URL ?? 'http://localhost:8083';

export const EMAIL_INTEGRATION_API_BASE_URL =
  process.env.REACT_APP_EMAIL_INTEGRATION_API_URL ?? 'http://localhost:8084';

export const OAUTH_CLIENT_ID =
  process.env.REACT_APP_OAUTH_CLIENT_ID ?? 'spa-client';

export const OAUTH_REDIRECT_URI =
  process.env.REACT_APP_OAUTH_REDIRECT_URI ??
  'http://localhost:3000/callback';

export const OAUTH_AUTHORIZE_URL = `${API_BASE_URL}/oauth2/authorize`;

export const OAUTH_TOKEN_URL = `${API_BASE_URL}/oauth2/token`;

export const OAUTH_SCOPES = 'openid profile';

export const ACCESS_TOKEN_KEY = 'access_token';

export const CODE_VERIFIER_KEY = 'pkce_code_verifier';

export const STATE_KEY = 'pkce_state';

export const ROLE_ADMIN = 'ROLE_ADMIN';

export const ROLE_USER = 'ROLE_USER';

export const ROLE_OPERATOR = 'ROLE_OPERATOR';
