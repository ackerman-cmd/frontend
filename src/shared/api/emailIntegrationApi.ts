import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store/store';
import { EMAIL_INTEGRATION_API_BASE_URL } from '../lib/constants';

// ─── Response types (contract §3.5) ──────────────────────────────────────────

export interface EmailRecipient {
  type: 'TO' | 'CC' | 'BCC';
  email: string;
  name?: string | null;
}

export interface EmailAttachment {
  id: string;
  messageId: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
  storageUrl?: string;
  isInline: boolean;
  contentId?: string;
}

export interface EmailMessageResponse {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  providerMessageId?: string;
  internetMessageId?: string;
  inReplyTo?: string;
  subject?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  textBody?: string;
  htmlBody?: string;
  sentAt?: string;
  receivedAt?: string;
  createdAt: string;
  recipients: EmailRecipient[];
  attachments: EmailAttachment[];
}

export interface MessageCreatedResponse {
  messageId: string;
  conversationId: string;
  status: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

/** §3.1 POST /internal/emails/send */
export interface SendEmailRequest {
  fromEmail: string;
  to: string[];
  cc?: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  createdByUserId?: string;
}

/** §3.2 POST /internal/emails/reply */
export interface ReplyEmailRequest {
  conversationId: string;
  replyToMessageId?: string;
  to: string[];
  cc?: string[];
  htmlBody?: string;
  textBody?: string;
  createdByUserId?: string;
}

/** §3.3 POST /internal/emails/forward */
export interface ForwardEmailRequest {
  messageId: string;
  to: string[];
  note?: string;
  createdByUserId?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const emailIntegrationApi = createApi({
  reducerPath: 'emailIntegrationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: EMAIL_INTEGRATION_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['EmailMessages'],
  endpoints: (builder) => ({
    /** §3.5 GET /internal/conversations/{conversationId}/messages */
    getEmailMessages: builder.query<EmailMessageResponse[], string>({
      query: (conversationId) =>
        `/internal/conversations/${conversationId}/messages`,
      providesTags: (_, __, id) => [{ type: 'EmailMessages', id }],
    }),

    /** §3.1 POST /internal/emails/send — new outbound conversation */
    sendEmail: builder.mutation<MessageCreatedResponse, SendEmailRequest>({
      query: (body) => ({ url: '/internal/emails/send', method: 'POST', body }),
    }),

    /** §3.2 POST /internal/emails/reply — reply in existing conversation */
    replyEmail: builder.mutation<MessageCreatedResponse, ReplyEmailRequest>({
      query: (body) => ({ url: '/internal/emails/reply', method: 'POST', body }),
      invalidatesTags: (_, __, req) => [{ type: 'EmailMessages', id: req.conversationId }],
    }),

    /** §3.3 POST /internal/emails/forward */
    forwardEmail: builder.mutation<MessageCreatedResponse, ForwardEmailRequest>({
      query: (body) => ({ url: '/internal/emails/forward', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetEmailMessagesQuery,
  useSendEmailMutation,
  useReplyEmailMutation,
  useForwardEmailMutation,
} = emailIntegrationApi;
