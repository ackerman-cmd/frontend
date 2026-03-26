import { crmApi } from './crmBaseApi';
import type { PageResponse } from '../../entities/common/types';
import type {
  OrganizationResponse,
  OrganizationRequest,
} from '../../entities/organization/model/types';

export const organizationsApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    getOrganizations: build.query<
      PageResponse<OrganizationResponse>,
      { page?: number; size?: number; sort?: string }
    >({
      query: ({ page = 0, size = 20, sort = 'name,ASC' } = {}) => ({
        url: '/api/v1/organizations',
        params: { page, size, sort },
      }),
      providesTags: ['Organization'],
    }),

    searchOrganizations: build.query<
      PageResponse<OrganizationResponse>,
      { name: string; page?: number; size?: number }
    >({
      query: ({ name, page = 0, size = 20 }) => ({
        url: '/api/v1/organizations/search',
        params: { name, page, size },
      }),
      providesTags: ['Organization'],
    }),

    createOrganization: build.mutation<OrganizationResponse, OrganizationRequest>({
      query: (body) => ({ url: '/api/v1/organizations', method: 'POST', body }),
      invalidatesTags: ['Organization'],
    }),

    getOrganizationById: build.query<OrganizationResponse, string>({
      query: (id) => `/api/v1/organizations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Organization', id }],
    }),

    updateOrganization: build.mutation<OrganizationResponse, { id: string; body: OrganizationRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/organizations/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Organization', { type: 'Organization', id }],
    }),

    deleteOrganization: build.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/organizations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Organization'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationsQuery,
  useSearchOrganizationsQuery,
  useCreateOrganizationMutation,
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} = organizationsApi;
