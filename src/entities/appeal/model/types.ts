import type { OperatorSummary } from '../../common/types';

export type AppealChannel = 'EMAIL' | 'CHAT';
export type AppealDirection = 'INBOUND' | 'OUTBOUND';
export type AppealStatus =
  | 'PENDING_PROCESSING'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT_RESPONSE'
  | 'CLOSED'
  | 'SPAM';
export type AppealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AppealMessageSenderType = 'OPERATOR' | 'CLIENT';

export interface OrganizationSummary {
  id: string;
  name: string;
  inn: string;
}

export interface AssignmentGroupSummary {
  id: string;
  name: string;
  operatorCount: number;
}

export interface SkillGroupSummary {
  id: string;
  name: string;
  skills: string[];
  operatorCount: number;
}

export interface AppealTopicSummary {
  id: string;
  name: string;
  category: string;
}

export interface AppealResponse {
  id: string;
  subject: string;
  description?: string;
  channel: AppealChannel;
  direction: AppealDirection;
  status: AppealStatus;
  priority: AppealPriority;
  organization?: OrganizationSummary;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedOperator?: OperatorSummary;
  assignmentGroup?: AssignmentGroupSummary;
  skillGroup?: SkillGroupSummary;
  topic?: AppealTopicSummary;
  topicId?: string;
  createdById: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** UUID переписки в email-integration-service, заполнен только для channel=EMAIL */
  emailConversationId?: string;
  /** VK peer_id пользователя/чата, заполнен только для channel=CHAT */
  vkPeerId?: number;
  /** Краткое резюме обращения, сгенерированное LLM-сервисом автоматически */
  summary?: string;
}

export interface AppealAction {
  action: string;
  label: string;
  description: string;
}

export interface AvailableActionsResponse {
  appealId: string;
  currentStatus: AppealStatus;
  currentStatusLabel?: string;
  actions: Array<{
    action: string;
    label: string;
    description: string;
    enabled: boolean;
    hint?: string;
  }>;
  availableStatusTransitions: Array<{
    status: AppealStatus;
    label: string;
  }>;
}

export interface AppealRequest {
  subject: string;
  description?: string;
  channel: AppealChannel;
  direction: AppealDirection;
  priority: AppealPriority;
  organizationId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedOperatorId?: string;
  assignmentGroupId?: string;
  skillGroupId?: string;
  topicId?: string;
}

export interface AppealUpdateRequest {
  subject?: string;
  description?: string;
  channel?: AppealChannel;
  priority?: AppealPriority;
  organizationId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignmentGroupId?: string;
  skillGroupId?: string;
  topicId?: string;
}

export interface AppealFilterRequest {
  status?: AppealStatus;
  channel?: AppealChannel;
  direction?: AppealDirection;
  priority?: AppealPriority;
  organizationId?: string;
  assignedOperatorId?: string;
  assignmentGroupId?: string;
  skillGroupId?: string;
  createdById?: string;
  subject?: string;
  contactEmail?: string;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: string;
}

export interface AppealMessageAttachment {
  id: string;
  attachmentType: string;
  fileName: string;
  mimeType: string;
  s3Url: string;
  fileSize?: number;
}

export interface AppealMessageResponse {
  id: string;
  appealId: string;
  senderType: AppealMessageSenderType;
  sender?: OperatorSummary;
  content: string;
  channel: AppealChannel;
  externalMessageId?: string;
  attachments: AppealMessageAttachment[];
  createdAt: string;
  /** Email-specific: HTML-тело письма (только для channel=EMAIL) */
  htmlContent?: string;
  /** Email-specific: адрес отправителя */
  fromEmail?: string;
  /** Email-specific: адреса получателей */
  toEmails?: string[];
  /** Email-specific: адреса в копии */
  ccEmails?: string[];
  /** Email-specific: тема письма */
  emailSubject?: string;
}

export interface AppealMessageRequest {
  content: string;
  channel: AppealChannel;
  externalMessageId?: string;
  /** Почтовый ящик-отправитель (только для channel=EMAIL) */
  fromEmail?: string;
  /** HTML-тело письма (только для channel=EMAIL) */
  htmlContent?: string;
}

export interface AssignOperatorRequest {
  operatorId?: string;
  assignmentGroupId?: string;
  skillGroupId?: string;
}

export interface ChangeStatusRequest {
  status: AppealStatus;
}

export const STATUS_TRANSITIONS: Record<AppealStatus, AppealStatus[]> = {
  PENDING_PROCESSING: ['IN_PROGRESS', 'SPAM', 'CLOSED'],
  IN_PROGRESS: ['WAITING_CLIENT_RESPONSE', 'CLOSED', 'SPAM'],
  WAITING_CLIENT_RESPONSE: ['IN_PROGRESS', 'CLOSED', 'SPAM'],
  SPAM: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};
