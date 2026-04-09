import { crmApi } from './crmBaseApi';

export interface ActiveMailboxResponse {
  groupId: string;
  groupType: 'ASSIGNMENT' | 'SKILL';
  groupName: string;
  email: string;
}

export const mailboxesApi = crmApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMailboxes: builder.query<ActiveMailboxResponse[], void>({
      query: () => '/api/v1/mailboxes/me',
    }),

    getAssignmentGroupMailbox: builder.query<ActiveMailboxResponse, string>({
      query: (groupId) => `/api/v1/mailboxes/assignment-groups/${groupId}`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyMailboxesQuery,
  useGetAssignmentGroupMailboxQuery,
} = mailboxesApi;
