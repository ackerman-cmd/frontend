import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../../shared/api/baseApi';
import { crmApi } from '../../shared/api/crmBaseApi';
import { emailIntegrationApi } from '../../shared/api/emailIntegrationApi';
import { reportsApi } from '../../shared/api/reportsApi';
import authReducer from '../../features/auth/model/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [crmApi.reducerPath]: crmApi.reducer,
    [emailIntegrationApi.reducerPath]: emailIntegrationApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware)
      .concat(crmApi.middleware)
      .concat(emailIntegrationApi.middleware)
      .concat(reportsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
