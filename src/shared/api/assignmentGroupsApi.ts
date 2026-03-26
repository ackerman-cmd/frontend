import { crmApi } from './crmBaseApi';
import type { PageResponse } from '../../entities/common/types';
import type {
  AssignmentGroupResponse,
  AssignmentGroupRequest,
  GroupOperatorsRequest,
} from '../../entities/assignmentGroup/model/types';

export const assignmentGroupsApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    getAssignmentGroups: build.query<
      PageResponse<AssignmentGroupResponse>,
      { page?: number; size?: number; sort?: string }
    >({
      query: ({ page = 0, size = 20, sort = 'name,ASC' } = {}) => ({
        url: '/api/v1/assignment-groups',
        params: { page, size, sort },
      }),
      providesTags: ['AssignmentGroup'],
    }),

    createAssignmentGroup: build.mutation<AssignmentGroupResponse, AssignmentGroupRequest>({
      query: (body) => ({ url: '/api/v1/assignment-groups', method: 'POST', body }),
      invalidatesTags: ['AssignmentGroup'],
    }),

    getAssignmentGroupById: build.query<AssignmentGroupResponse, string>({
      query: (id) => `/api/v1/assignment-groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AssignmentGroup', id }],
    }),

    updateAssignmentGroup: build.mutation<
      AssignmentGroupResponse,
      { id: string; body: AssignmentGroupRequest }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/assignment-groups/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['AssignmentGroup', { type: 'AssignmentGroup', id }],
    }),

    deleteAssignmentGroup: build.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/assignment-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AssignmentGroup'],
    }),

    addOperatorsToAssignmentGroup: build.mutation<
      AssignmentGroupResponse,
      { id: string } & GroupOperatorsRequest
    >({
      query: ({ id, operatorIds }) => ({
        url: `/api/v1/assignment-groups/${id}/operators`,
        method: 'POST',
        body: { operatorIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AssignmentGroup', id }],
    }),

    removeOperatorFromAssignmentGroup: build.mutation<
      AssignmentGroupResponse,
      { id: string; operatorId: string }
    >({
      query: ({ id, operatorId }) => ({
        url: `/api/v1/assignment-groups/${id}/operators/${operatorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AssignmentGroup', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssignmentGroupsQuery,
  useCreateAssignmentGroupMutation,
  useGetAssignmentGroupByIdQuery,
  useUpdateAssignmentGroupMutation,
  useDeleteAssignmentGroupMutation,
  useAddOperatorsToAssignmentGroupMutation,
  useRemoveOperatorFromAssignmentGroupMutation,
} = assignmentGroupsApi;
