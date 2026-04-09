import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Space, Spin, Alert, Descriptions, Card, Select,
  Modal, message, Popconfirm, Form, Row, Col, Tooltip, Tag, Divider,
  Typography, Radio, Input, Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, CloseCircleOutlined, StopOutlined,
  UserSwitchOutlined, SendOutlined, EditOutlined, DeleteOutlined,
  TagOutlined, UserOutlined, BankOutlined, TeamOutlined,
  ReloadOutlined, MailOutlined, MessageOutlined, PhoneOutlined, FileTextOutlined,
  PaperClipOutlined, ForwardOutlined, CaretDownOutlined, CaretRightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import {
  useGetAppealByIdQuery,
  useGetAppealMessagesQuery,
  useTakeAppealMutation,
  useCloseAppealMutation,
  useMarkAppealAsSpamMutation,
  useAssignOperatorMutation,
  useSendOperatorMessageMutation,
  useUpdateAppealMutation,
  useDeleteAppealMutation,
  useGetAvailableActionsQuery,
} from '../../shared/api/appealsApi';
import { useGetGroupedTopicsQuery } from '../../shared/api/appealTopicsApi';
import { useGetOrganizationsQuery } from '../../shared/api/organizationsApi';
import { useGetAssignmentGroupsQuery } from '../../shared/api/assignmentGroupsApi';
import { useGetSkillGroupsQuery } from '../../shared/api/skillGroupsApi';
import { useGetGroupsWithOperatorsQuery } from '../../shared/api/referencesApi';
import { useGetMyMailboxesQuery, useGetAssignmentGroupMailboxQuery } from '../../shared/api/mailboxesApi';
import { useGetEmailMessagesQuery } from '../../shared/api/emailIntegrationApi';
import type { EmailMessageResponse } from '../../shared/api/emailIntegrationApi';
import type { OperatorSummaryResponse } from '../../entities/groupReference/model/types';
import type { AppealStatus, AppealUpdateRequest, AppealMessageResponse, AppealChannel } from '../../entities/appeal/model/types';
import {
  AppealStatusBadge, AppealPriorityBadge, AppealChannelTag, AppealDirectionTag,
  STATUS_LABELS, PRIORITY_LABELS, CHANNEL_LABELS,
} from '../../entities/appeal/ui/AppealBadges';
import type { AppealTopicCategory } from '../../entities/appealTopic/model/types';
import { TOPIC_CATEGORY_LABELS, TOPIC_CATEGORY_ICONS } from '../../entities/appealTopic/model/types';
import { useAuth } from '../../shared/hooks/useAuth';
import RichTextEditor from '../../shared/ui/RichTextEditor/RichTextEditor';

const { Title, Text } = Typography;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const editSchema = z.object({
  subject: z.string().min(1, 'Обязательное поле').max(512),
  description: z.string().optional(),
  channel: z.enum(['EMAIL', 'LETTER', 'CALL', 'CHAT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Некорректный email').optional().or(z.literal('')),
  contactPhone: z.string().max(32).optional(),
  topicId: z.string().uuid().optional().or(z.literal('')),
  organizationId: z.string().uuid().optional().or(z.literal('')),
  assignmentGroupId: z.string().uuid().optional().or(z.literal('')),
  skillGroupId: z.string().uuid().optional().or(z.literal('')),
});
type EditFormValues = z.infer<typeof editSchema>;

// ─── Channel config ───────────────────────────────────────────────────────────

const CHANNEL_ICON: Record<AppealChannel, React.ReactNode> = {
  EMAIL: <MailOutlined />,
  CHAT: <MessageOutlined />,
  CALL: <PhoneOutlined />,
  LETTER: <FileTextOutlined />,
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  TAKE_INTO_WORK: <PlayCircleOutlined />,
  TAKE_IN_WORK: <PlayCircleOutlined />,
  ASSIGN_OPERATOR: <UserSwitchOutlined />,
  CLOSE: <CloseCircleOutlined />,
  MARK_AS_SPAM: <StopOutlined />,
};

// ─── Email message card ───────────────────────────────────────────────────────

function EmailMessageCard({
  msg, contactEmail, isClosed, canReply, onReplyClick, onForwardClick,
}: {
  msg: EmailMessageResponse;
  contactEmail?: string;
  isClosed: boolean;
  canReply: boolean;
  onReplyClick: () => void;
  onForwardClick?: (msgId: string) => void;
}) {
  const isClient = msg.direction === 'INBOUND';
  const [expanded, setExpanded] = useState(true);

  const fromLabel = msg.fromName
    ? `${msg.fromName} <${msg.fromEmail ?? ''}>`
    : (msg.fromEmail ?? (isClient ? (contactEmail ?? 'Клиент') : 'Оператор'));

  const toRecipients = msg.recipients.filter((r) => r.type === 'TO');
  const ccRecipients = msg.recipients.filter((r) => r.type === 'CC');
  const toLabel = toRecipients.map((r) => r.email).join(', ') || '—';
  const ccLabel = ccRecipients.map((r) => r.email).join(', ');

  const initials = (msg.fromName ?? msg.fromEmail ?? (isClient ? 'К' : 'О'))
    .slice(0, 1).toUpperCase();

  const bodyContent = msg.htmlBody ?? msg.textBody ?? '';
  const isHtml = Boolean(msg.htmlBody) || /<[a-z][\s\S]*>/i.test(bodyContent);

  const timestamp = msg.receivedAt ?? msg.sentAt ?? msg.createdAt;

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isClient ? '#e8e8e8' : '#bae0ff'}`,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
          cursor: 'pointer',
          background: isClient ? '#fff' : '#f0f7ff',
          borderBottom: expanded ? '1px solid #f5f5f5' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isClient ? '#e6f4ff' : '#1677ff',
          color: isClient ? '#1677ff' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15,
          border: isClient ? '1.5px solid #91caff' : 'none',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1f1f1f' }}>{fromLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <span style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                {dayjs(timestamp).format('DD.MM.YYYY, HH:mm')}
              </span>
              {expanded
                ? <CaretDownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                : <CaretRightOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />}
            </div>
          </div>

          {expanded ? (
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              <span>Кому: </span>
              <span style={{ color: '#595959' }}>{toLabel}</span>
              {ccLabel && (
                <span style={{ marginLeft: 10 }}>
                  Копия: <span style={{ color: '#595959' }}>{ccLabel}</span>
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 600 }}>
              {msg.textBody ?? msg.subject ?? ''}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <>
          <div style={{ padding: '16px 16px 12px 64px' }}>
            {isHtml ? (
              <div
                style={{ fontSize: 14, lineHeight: 1.7, color: '#1f1f1f', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: bodyContent }}
              />
            ) : (
              <pre style={{
                margin: 0, fontFamily: 'inherit', fontSize: 14,
                lineHeight: 1.7, color: '#1f1f1f', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {bodyContent || <span style={{ color: '#bfbfbf' }}>(нет содержимого)</span>}
              </pre>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '6px 16px 12px 64px', gap: 6,
          }}>
            <Tooltip title={`Message ID: ${msg.id}`}>
              <span style={{ fontSize: 11, color: '#bfbfbf', marginRight: 'auto' }}>
                <PaperClipOutlined style={{ marginRight: 3 }} />
                {msg.id.slice(0, 8)}…
              </span>
            </Tooltip>
            {!isClosed && canReply && (
              <Button size="small" icon={<SendOutlined />} onClick={onReplyClick}
                style={{ borderRadius: 6 }}>
                Ответить
              </Button>
            )}
            {!isClosed && onForwardClick && (
              <Button size="small" icon={<ForwardOutlined />}
                onClick={() => onForwardClick(msg.id)}
                style={{ borderRadius: 6 }}>
                Переслать
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Email composer ────────────────────────────────────────────────────────────

interface EmailComposerProps {
  toEmail?: string;
  subject: string;
  fromEmail: string;
  onFromEmailChange: (v: string) => void;
  mailboxOptions: { label: string; value: string; groupName: string }[];
  mailboxesLoading?: boolean;
  mailboxesError?: boolean;
  htmlContent: string;
  onHtmlChange: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onCancel?: () => void;
  disabled: boolean;
}

function EmailComposer({
  toEmail, subject, fromEmail, onFromEmailChange,
  mailboxOptions, mailboxesLoading, mailboxesError, htmlContent, onHtmlChange,
  loading, onSend, onCancel, disabled,
}: EmailComposerProps) {
  return (
    <div style={{
      border: '1.5px solid #1677ff',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 2px 12px rgba(22,119,255,0.10)',
    }}>
      {/* Meta fields */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', background: '#fafcff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8c8c8c', width: 52, flexShrink: 0 }}>Кому:</span>
          <span style={{
            fontSize: 13, background: '#e6f4ff', color: '#1677ff',
            padding: '2px 12px', borderRadius: 20,
            border: '1px solid #91caff', fontWeight: 500,
          }}>
            {toEmail ?? 'клиент'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#8c8c8c', width: 52, flexShrink: 0 }}>От кого:</span>
          {mailboxesLoading ? (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>Загрузка ящиков...</span>
          ) : mailboxesError ? (
            <span style={{ fontSize: 12, color: '#ff4d4f' }}>Ошибка загрузки ящиков</span>
          ) : mailboxOptions.length > 0 ? (
            <Select
              value={fromEmail || undefined}
              onChange={onFromEmailChange}
              style={{ minWidth: 280, flex: 1, maxWidth: 440 }}
              size="small"
              placeholder="Выберите почтовый ящик..."
              options={mailboxOptions.map((m) => ({
                value: m.value,
                label: (
                  <span>
                    <MailOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                    <strong>{m.value}</strong>
                    <span style={{ color: '#8c8c8c', fontSize: 11, marginLeft: 6 }}>({m.groupName})</span>
                  </span>
                ),
              }))}
            />
          ) : (
            <span style={{ fontSize: 12, color: '#bfbfbf' }}>Нет доступных почтовых ящиков</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#8c8c8c', width: 52, flexShrink: 0 }}>Тема:</span>
          <span style={{ fontSize: 13, color: '#595959' }}>{subject}</span>
        </div>
      </div>

      {/* Rich text editor */}
      <div style={{ padding: '10px 14px' }}>
        <RichTextEditor
          value={htmlContent}
          onChange={onHtmlChange}
          placeholder="Введите ответ клиенту..."
          minHeight={160}
          disabled={disabled}
        />
      </div>

      {/* Composer footer */}
      <div style={{
        borderTop: '1px solid #f0f0f0', padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fafcff',
      }}>
        <span style={{ fontSize: 11, color: '#bfbfbf' }}>
          Ctrl+B — жирный · Ctrl+I — курсив · Ctrl+Z — отменить
        </span>
        <Space>
          {onCancel && (
            <Button size="middle" onClick={onCancel} style={{ borderRadius: 6 }}>
              Отмена
            </Button>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            disabled={disabled || !fromEmail}
            onClick={onSend}
            style={{ borderRadius: 6 }}
          >
            Отправить письмо
          </Button>
        </Space>
      </div>
    </div>
  );
}

// ─── Chat / other channel composer ────────────────────────────────────────────

function ChatComposer({
  channel, content, onChange, loading, disabled, onSend,
}: {
  channel: AppealChannel;
  content: string;
  onChange: (v: string) => void;
  loading: boolean;
  disabled: boolean;
  onSend: () => void;
}) {
  const placeholder: Record<AppealChannel, string> = {
    CHAT: 'Введите сообщение...',
    CALL: 'Запись звонка / комментарий...',
    LETTER: 'Текст письма...',
    EMAIL: 'Введите сообщение...',
  };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <Input.TextArea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder[channel]}
        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); onSend(); } }}
        style={{ resize: 'none', borderRadius: 8, flex: 1 }}
        disabled={disabled}
      />
      <Button
        type="primary" icon={<SendOutlined />}
        loading={loading} disabled={disabled || !content.trim()}
        onClick={onSend} size="large"
        style={{ borderRadius: 8, flexShrink: 0 }}
      />
    </div>
  );
}

// ─── Chat message bubble ──────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: AppealMessageResponse }) {
  const isOperator = msg.senderType === 'OPERATOR';
  return (
    <div style={{ display: 'flex', flexDirection: isOperator ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isOperator ? '#1677ff' : '#e8e8e8',
        color: isOperator ? '#fff' : '#595959',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>
        {isOperator ? (msg.sender?.fullName ?? 'О').slice(0, 1).toUpperCase() : 'К'}
      </div>
      <div style={{ maxWidth: '72%' }}>
        <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3, textAlign: isOperator ? 'right' : 'left' }}>
          {isOperator ? (msg.sender?.fullName ?? 'Оператор') : 'Клиент'}
          {' · '}{dayjs(msg.createdAt).format('DD.MM HH:mm')}
        </div>
        <div style={{
          background: isOperator ? '#1677ff' : '#fff',
          color: isOperator ? '#fff' : '#1f1f1f',
          border: isOperator ? 'none' : '1px solid #e8e8e8',
          borderRadius: isOperator ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          padding: '9px 13px', fontSize: 14, lineHeight: 1.6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ─── Compact operator chip ────────────────────────────────────────────────────

function AssignmentChip({
  appeal,
  onAssignClick,
}: {
  appeal: any;
  onAssignClick: () => void;
}) {
  const op = appeal.assignedOperator;
  const ag = appeal.assignmentGroup;
  const sg = appeal.skillGroup;

  if (!op && !ag && !sg) {
    return (
      <Tooltip title="Назначить оператора">
        <Button size="small" icon={<UserSwitchOutlined />} onClick={onAssignClick}
          style={{ borderRadius: 20, border: '1px dashed #d9d9d9', color: '#8c8c8c' }}>
          Не назначено
        </Button>
      </Tooltip>
    );
  }

  const menuItems = [
    {
      key: 'reassign',
      icon: <UserSwitchOutlined />,
      label: op ? 'Переназначить оператора' : 'Назначить оператора',
      onClick: onAssignClick,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        background: '#f0f7ff', border: '1px solid #91caff',
        borderRadius: 20, padding: '3px 12px 3px 6px',
        userSelect: 'none',
      }}>
        {op ? (
          <>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#1677ff',
              color: '#fff', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {op.fullName.slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>{op.fullName}</span>
          </>
        ) : (
          <>
            <TeamOutlined style={{ color: '#1677ff', fontSize: 14 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
              {ag?.name ?? sg?.name}
            </span>
          </>
        )}
        <DownOutlined style={{ fontSize: 9, color: '#8c8c8c', marginLeft: 2 }} />
      </div>
    </Dropdown>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AppealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetValue, setAssignTargetValue] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Email composer state
  const [emailHtml, setEmailHtml] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  // Chat composer state
  const [chatContent, setChatContent] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: appeal, isLoading, isError, refetch } = useGetAppealByIdQuery(id!, { skip: !id });

  const isEmail = appeal?.channel === 'EMAIL';
  const appealLoaded = Boolean(appeal);

  // Non-email channels: arm-support-service messages with polling
  // appealLoaded ensures we don't fire this request before knowing the channel
  const { data: messagesPage, isLoading: msgsLoading } = useGetAppealMessagesQuery(
    { id: id! },
    { skip: !id || !appealLoaded || isEmail, pollingInterval: 15000 },
  );

  // Email channel: messages come strictly from email-integration-service (§8.5)
  const {
    data: emailMessages = [],
    isLoading: emailMsgsLoading,
    isError: emailMsgsError,
    refetch: refetchEmailMessages,
  } = useGetEmailMessagesQuery(
    appeal?.emailConversationId ?? '',
    {
      skip: !appealLoaded || !isEmail || !appeal?.emailConversationId,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: actionsData, refetch: refetchActions } = useGetAvailableActionsQuery(id!, {
    skip: !id,
  });

  // canReply is server-driven via REPLY_TO_CLIENT action:
  // - enabled only in IN_PROGRESS with APPEAL_WRITE permission
  // - after operator reply → WAITING_CLIENT_RESPONSE → disabled until re-take or client reply
  const replyAction = actionsData?.actions?.find((a) => a.action === 'REPLY_TO_CLIENT');
  const canReply = replyAction?.enabled ?? false;
  const replyHint = replyAction?.hint ?? '';
  const { data: groupedTopics } = useGetGroupedTopicsQuery();
  const { data: groupsWithOperators, isLoading: refsLoading } = useGetGroupsWithOperatorsQuery(undefined, {
    skip: !assignModalOpen,
  });
  const { data: orgsPage } = useGetOrganizationsQuery({ size: 200 });
  const { data: agPage } = useGetAssignmentGroupsQuery({ size: 200 });
  const { data: sgPage } = useGetSkillGroupsQuery({ size: 200 });

  // Mailboxes — only after appeal is loaded and channel is EMAIL
  const {
    data: myMailboxes,
    isLoading: mailboxesLoading,
    isError: mailboxesError,
  } = useGetMyMailboxesQuery(undefined, {
    skip: !appealLoaded || !isEmail,
    refetchOnMountOrArgChange: true,
  });
  const { data: groupMailbox } = useGetAssignmentGroupMailboxQuery(
    appeal?.assignmentGroup?.id ?? '',
    {
      skip: !appealLoaded || !isEmail || !appeal?.assignmentGroup?.id,
      refetchOnMountOrArgChange: true,
    },
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [takeAppeal, { isLoading: taking }] = useTakeAppealMutation();
  const [closeAppeal, { isLoading: closing }] = useCloseAppealMutation();
  const [markAsSpam, { isLoading: spamming }] = useMarkAppealAsSpamMutation();
  const [assignOperator, { isLoading: assigning }] = useAssignOperatorMutation();
  const [sendMessage, { isLoading: sending }] = useSendOperatorMessageMutation();
  const [updateAppeal, { isLoading: updating }] = useUpdateAppealMutation();
  const [deleteAppeal] = useDeleteAppealMutation();

  // Email отправляется через arm-support-service sendMessage:
  // arm-support сам вызывает email-integration-service и проставляет emailConversationId

  // ── Edit form ──────────────────────────────────────────────────────────────
  const {
    control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (appeal) {
      resetEdit({
        subject: appeal.subject,
        description: appeal.description ?? '',
        channel: appeal.channel,
        priority: appeal.priority,
        contactName: appeal.contactName ?? '',
        contactEmail: appeal.contactEmail ?? '',
        contactPhone: appeal.contactPhone ?? '',
        topicId: appeal.topic?.id ?? '',
        organizationId: appeal.organization?.id ?? '',
        assignmentGroupId: appeal.assignmentGroup?.id ?? '',
        skillGroupId: appeal.skillGroup?.id ?? '',
      });
    }
  }, [appeal, resetEdit]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesPage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [emailMessages]);

  // Combine mailbox options
  const mailboxOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string; groupName: string }[] = [];
    const all = [
      ...(myMailboxes ?? []),
      ...(groupMailbox ? [groupMailbox] : []),
    ];
    for (const m of all) {
      if (!seen.has(m.email)) {
        seen.add(m.email);
        opts.push({ label: m.email, value: m.email, groupName: m.groupName });
      }
    }
    return opts;
  }, [myMailboxes, groupMailbox]);

  // Auto-select first mailbox
  useEffect(() => {
    if (mailboxOptions.length > 0 && !fromEmail) {
      setFromEmail(mailboxOptions[0].value);
    }
  }, [mailboxOptions, fromEmail]);

  // Auto-close composer if the action becomes disabled (e.g. after sending — status → WAITING_CLIENT_RESPONSE)
  useEffect(() => {
    if (!canReply) {
      setShowComposer(false);
    }
  }, [canReply]);

  if (!id) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" tip="Загрузка обращения..." />
      </div>
    );
  }
  if (isError || !appeal) {
    return (
      <Alert type="error" showIcon message="Обращение не найдено"
        description="Обращение не существует или у вас нет прав доступа."
        action={<Button onClick={() => navigate('/appeals')}>К списку</Button>}
        style={{ maxWidth: 560 }}
      />
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTake = async () => {
    try { await takeAppeal(id).unwrap(); message.success('Взято в работу'); }
    catch { message.error('Не удалось взять обращение'); }
    finally { refetchActions(); }
  };

  const handleClose = async () => {
    try { await closeAppeal(id).unwrap(); message.success('Обращение закрыто'); }
    catch { message.error('Ошибка закрытия'); }
    finally { refetchActions(); }
  };

  const handleSpam = async () => {
    try { await markAsSpam(id).unwrap(); message.success('Помечено как спам'); }
    catch { message.error('Операция недоступна'); }
    finally { refetchActions(); }
  };

  const handleAssign = async () => {
    if (!assignTargetValue) return;
    const [kind, targetId] = assignTargetValue.split(':');
    try {
      if (kind === 'operator') await assignOperator({ id, operatorId: targetId }).unwrap();
      else if (kind === 'assignmentGroup') await assignOperator({ id, assignmentGroupId: targetId }).unwrap();
      else if (kind === 'skillGroup') await assignOperator({ id, skillGroupId: targetId }).unwrap();
      message.success('Назначено');
      setAssignModalOpen(false);
      setAssignTargetValue(null);
    } catch { message.error('Не удалось назначить'); }
    finally { refetchActions(); }
  };

  const handleSendEmail = async () => {
    const textContent = emailHtml.replace(/<[^>]+>/g, '').trim();
    if (!textContent && !emailHtml.trim()) { message.warning('Введите текст письма'); return; }
    if (!fromEmail && !appeal.emailConversationId) {
      message.warning('Выберите почтовый ящик');
      return;
    }
    if (!appeal.contactEmail) { message.warning('У обращения не указан email контакта'); return; }

    try {
      // Один вызов в arm-support-service: бэк сам решает send vs reply по appeal.emailConversationId,
      // сам дёргает email-integration-service через EmailIntegrationClient и сохраняет conversationId на обращении.
      await sendMessage({
        id,
        body: {
          content: textContent || '(html-письмо)',
          channel: 'EMAIL',
          fromEmail: appeal.emailConversationId ? undefined : fromEmail,
          htmlContent: emailHtml || undefined,
        },
      }).unwrap();

      setEmailHtml('');
      setShowComposer(false);
      message.success('Письмо отправлено');
      // Обновляем appeal (чтобы подтянуть emailConversationId при первой отправке),
      // переписку и доступные действия
      refetch();
      refetchEmailMessages();
      refetchActions();
    } catch {
      message.error('Не удалось отправить письмо');
    }
  };

  const handleSendChat = async () => {
    if (!chatContent.trim()) return;
    try {
      await sendMessage({ id, body: { content: chatContent, channel: appeal.channel } }).unwrap();
      setChatContent('');
    } catch { message.error('Не удалось отправить сообщение'); }
  };

  const handleEdit = handleEditSubmit(async (values) => {
    const body: AppealUpdateRequest = {
      subject: values.subject,
      description: values.description || undefined,
      channel: values.channel,
      priority: values.priority,
      contactName: values.contactName || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      topicId: values.topicId || undefined,
      organizationId: values.organizationId || undefined,
      assignmentGroupId: values.assignmentGroupId || undefined,
      skillGroupId: values.skillGroupId || undefined,
    };
    try { await updateAppeal({ id, body }).unwrap(); message.success('Обновлено'); setEditOpen(false); }
    catch { message.error('Не удалось обновить'); }
  });

  const handleDelete = async () => {
    try { await deleteAppeal(id).unwrap(); message.success('Удалено'); navigate('/appeals'); }
    catch { message.error('Не удалось удалить'); }
  };

  const handleAction = (action: string) => {
    if (action === 'TAKE_INTO_WORK' || action === 'TAKE_IN_WORK') handleTake();
    else if (action === 'ASSIGN_OPERATOR') setAssignModalOpen(true);
    else if (action === 'CLOSE') handleClose();
    else if (action === 'MARK_AS_SPAM') handleSpam();
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const actions = actionsData?.actions ?? [];
  const headerActions = actions.filter((a) =>
    ['TAKE_INTO_WORK', 'TAKE_IN_WORK', 'ASSIGN_OPERATOR', 'CLOSE', 'MARK_AS_SPAM'].includes(a.action)
  );
  // For non-email channels use arm-support-service messages; for email — email-integration-service
  const messagesList = messagesPage?.content ?? [];
  const isClosed = appeal.status === 'CLOSED';

  const editAction = actionsData?.actions?.find((a) => a.action === 'EDIT');
  const deleteAction = actionsData?.actions?.find((a) => a.action === 'DELETE');
  const editEnabled = editAction ? editAction.enabled : true;
  const deleteEnabled = deleteAction ? deleteAction.enabled : isAdmin;

  const topicSelectOptions = Object.entries(groupedTopics ?? {}).flatMap(([category, rawTopics]) => {
    const items: any[] = Array.isArray(rawTopics) ? rawTopics : [];
    if (items.length === 0) return [];
    const cat = category as AppealTopicCategory;
    return [{
      label: `${TOPIC_CATEGORY_ICONS[cat] ?? ''} ${TOPIC_CATEGORY_LABELS[cat] ?? category}`,
      options: items.map((t) => ({ value: t.id, label: t.name })),
    }];
  });

  const operatorFullName = (op: OperatorSummaryResponse) =>
    [op.firstName, op.lastName].filter(Boolean).join(' ') || op.username;

  // ── Layout: email vs non-email ─────────────────────────────────────────────

  const infoRow = (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      {/* Details */}
      <Col xs={24} md={12}>
        <Card
          title={<Space size={6}><TagOutlined style={{ color: '#1677ff' }} />Детали</Space>}
          size="small"
          style={{ borderRadius: 12, border: '1.5px solid #f0f0f0', height: '100%' }}
        >
          <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 110 }}>
            {appeal.topic && (
              <Descriptions.Item label="Тематика">
                <div style={{
                  maxWidth: '100%', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  <Tag color="geekblue" style={{ borderRadius: 8, maxWidth: '100%' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: 160 }}>
                      {appeal.topic.name}
                    </span>
                  </Tag>
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Создано">
              {dayjs(appeal.createdAt).format('DD.MM.YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Обновлено">
              {dayjs(appeal.updatedAt).format('DD.MM.YYYY HH:mm')}
            </Descriptions.Item>
            {appeal.closedAt && (
              <Descriptions.Item label="Закрыто">
                {dayjs(appeal.closedAt).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
            )}
            {appeal.description && (
              <Descriptions.Item label="Описание">
                <Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{appeal.description}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
          {appeal.organization && (
            <>
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <BankOutlined style={{ color: '#1677ff' }} />{appeal.organization.name}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>ИНН: {appeal.organization.inn}</div>
            </>
          )}
        </Card>
      </Col>

      {/* Contact */}
      <Col xs={24} md={12}>
        <Card
          title={<Space size={6}><UserOutlined style={{ color: '#1677ff' }} />Контакт</Space>}
          size="small"
          style={{ borderRadius: 12, border: '1.5px solid #f0f0f0', height: '100%' }}
        >
          {(appeal.contactName || appeal.contactEmail || appeal.contactPhone) ? (
            <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 60 }}>
              {appeal.contactName && (
                <Descriptions.Item label="Имя">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{appeal.contactName}</span>
                </Descriptions.Item>
              )}
              {appeal.contactEmail && (
                <Descriptions.Item label="Email">
                  <Typography.Text
                    copyable={{ tooltips: ['Копировать', 'Скопировано'] }}
                    style={{ fontSize: 12 }}
                  >
                    <a href={`mailto:${appeal.contactEmail}`} style={{ color: '#1677ff' }}>
                      {appeal.contactEmail}
                    </a>
                  </Typography.Text>
                </Descriptions.Item>
              )}
              {appeal.contactPhone && (
                <Descriptions.Item label="Тел.">
                  <Typography.Text
                    copyable={{ tooltips: ['Копировать', 'Скопировано'] }}
                    style={{ fontSize: 12 }}
                  >
                    <a href={`tel:${appeal.contactPhone}`} style={{ color: '#1677ff' }}>
                      {appeal.contactPhone}
                    </a>
                  </Typography.Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <div style={{ color: '#bfbfbf', fontSize: 13 }}>Контакт не указан</div>
          )}

          {(appeal.assignmentGroup || appeal.skillGroup) && (
            <>
              <Divider style={{ margin: '10px 0' }} />
              {appeal.assignmentGroup && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Группа назначения</div>
                  <Tag color="blue" style={{ borderRadius: 8 }}>{appeal.assignmentGroup.name}</Tag>
                </div>
              )}
              {appeal.skillGroup && (
                <div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Скилл-группа</div>
                  <Tag color="purple" style={{ borderRadius: 8 }}>{appeal.skillGroup.name}</Tag>
                </div>
              )}
            </>
          )}
        </Card>
      </Col>
    </Row>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: isEmail ? 1100 : 1300, margin: '0 auto', animation: 'fadeInUp 0.25s ease both' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 12,
        padding: '14px 22px', marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <button type="button" onClick={() => navigate('/appeals')}
          style={{
            background: 'transparent', border: 'none', padding: 0, marginBottom: 8,
            fontSize: 12, color: '#8c8c8c', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <ArrowLeftOutlined />Обращения
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: isEmail ? '#e6f4ff' : '#f9f0ff',
                color: isEmail ? '#1677ff' : '#722ed1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>
                {CHANNEL_ICON[appeal.channel]}
              </div>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3, wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
                {appeal.subject}
              </Title>
              {appeal.topic && (
                <Tooltip title={appeal.topic.name}>
                  <Tag icon={<TagOutlined />} color="geekblue" style={{ borderRadius: 10, margin: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appeal.topic.name}
                  </Tag>
                </Tooltip>
              )}
            </div>

            {/* Status badges + assignment chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <AppealStatusBadge status={appeal.status} />
              <AppealPriorityBadge priority={appeal.priority} />
              <AppealChannelTag channel={appeal.channel} />
              <AppealDirectionTag direction={appeal.direction} />
              <div style={{ marginLeft: 4 }}>
                <AssignmentChip appeal={appeal} onAssignClick={() => setAssignModalOpen(true)} />
              </div>
            </div>

            {/* Action buttons (NO status change selector) */}
            <Space wrap size={8}>
              {headerActions.map((act) => {
                if (act.action === 'ASSIGN_OPERATOR') return null;
                const isDanger = act.action === 'MARK_AS_SPAM';
                const isConfirm = act.action === 'CLOSE' || act.action === 'MARK_AS_SPAM';
                const isEnabled = Boolean(act.enabled);
                const isTakeAction = act.action === 'TAKE_IN_WORK' || act.action === 'TAKE_INTO_WORK';
                const finalDisabled = (isTakeAction && appeal.status === 'IN_PROGRESS') || !isEnabled;

                const btn = (
                  <Tooltip key={`${act.action}-t`} title={isEnabled ? act.description : act.hint}>
                    <span>
                      <Button
                        type={act.action === 'TAKE_INTO_WORK' || act.action === 'TAKE_IN_WORK' ? 'primary' : 'default'}
                        icon={ACTION_ICONS[act.action]}
                        danger={isDanger}
                        disabled={finalDisabled}
                        loading={
                          ((act.action === 'TAKE_IN_WORK' || act.action === 'TAKE_INTO_WORK') && taking) ||
                          (act.action === 'CLOSE' && closing) ||
                          (act.action === 'MARK_AS_SPAM' && spamming)
                        }
                        onClick={isConfirm ? undefined : () => handleAction(act.action)}
                        size="middle"
                      >
                        {act.label}
                      </Button>
                    </span>
                  </Tooltip>
                );
                if (isConfirm && isEnabled) {
                  return (
                    <Popconfirm key={act.action} title={`${act.label}?`} description={act.hint ?? act.description}
                      onConfirm={() => handleAction(act.action)} okText="Да" cancelText="Нет"
                      okButtonProps={{ danger: isDanger }}>
                      {btn}
                    </Popconfirm>
                  );
                }
                return btn;
              })}
            </Space>
          </div>

          {/* Edit / delete / refresh */}
          <Space>
            <Tooltip title="Обновить"><Button icon={<ReloadOutlined />} onClick={() => refetch()} /></Tooltip>
            <Tooltip title={editEnabled ? 'Редактировать' : (editAction?.hint ?? '')}>
              <span><Button icon={<EditOutlined />} disabled={!editEnabled} onClick={() => editEnabled && setEditOpen(true)} /></span>
            </Tooltip>
            <Tooltip title={deleteEnabled ? 'Удалить' : (deleteAction?.hint ?? '')}>
              <span>
                {deleteEnabled ? (
                  <Popconfirm title="Удалить обращение?" description="Это действие необратимо."
                    onConfirm={handleDelete} okText="Удалить" okButtonProps={{ danger: true }} cancelText="Отмена">
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ) : (
                  <Button danger icon={<DeleteOutlined />} disabled />
                )}
              </span>
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}

      {isEmail ? (
        /* EMAIL layout: info row → thread full width */
        <>
          {infoRow}

          {/* Email thread */}
          <div style={{
            background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 12,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {/* Thread header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #f0f0f0',
              background: '#fafcff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Переписка по email</span>
                <Tag style={{ borderRadius: 20, fontSize: 11 }}>
                  {emailMessages.length} писем
                </Tag>
                {appeal.emailConversationId && (
                  <Tooltip title={`Conversation ID: ${appeal.emailConversationId}`}>
                    <Tag color="blue" style={{ borderRadius: 20, fontSize: 10, cursor: 'default' }}>
                      #{appeal.emailConversationId.slice(0, 8)}
                    </Tag>
                  </Tooltip>
                )}
              </div>
              <Space size={6}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  Тема: {appeal.subject}
                </div>
                <Button
                  size="small" icon={<ReloadOutlined />}
                  onClick={() => refetchEmailMessages()}
                  loading={emailMsgsLoading}
                  style={{ borderRadius: 6 }}
                />
              </Space>
            </div>

            {/* Messages */}
            <div style={{
              padding: '16px 20px', background: '#f5f7fb',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 200, maxHeight: 560, overflowY: 'auto',
            }}>
              {emailMsgsLoading && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="Загрузка переписки..." />
                </div>
              )}
              {emailMsgsError && (
                <Alert
                  type="error" showIcon
                  message="Не удалось загрузить переписку"
                  description="Проверьте доступность email-integration-service"
                  style={{ borderRadius: 8 }}
                />
              )}
              {!emailMsgsLoading && !emailMsgsError && emailMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: '#bfbfbf' }}>
                  <MailOutlined style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.3 }} />
                  {appeal.emailConversationId
                    ? 'Писем пока нет'
                    : 'Переписка ещё не начата'}
                </div>
              )}
              {emailMessages.map((msg) => (
                <EmailMessageCard
                  key={msg.id}
                  msg={msg}
                  contactEmail={appeal.contactEmail}
                  isClosed={isClosed}
                  canReply={canReply}
                  onReplyClick={() => setShowComposer(true)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer / closed / reply-disabled */}
            <div style={{ padding: '16px 20px', borderTop: '2px solid #e6f4ff' }}>
              {isClosed ? (
                <div style={{ textAlign: 'center', color: '#52c41a', fontSize: 13, fontWeight: 500 }}>
                  Обращение закрыто — переписка завершена
                </div>
              ) : !canReply ? (
                <Alert
                  type="info"
                  showIcon
                  message="Отправка письма сейчас недоступна"
                  description={replyHint || 'Чтобы отправить письмо, возьмите обращение в работу.'}
                  style={{ borderRadius: 8 }}
                />
              ) : showComposer ? (
                <EmailComposer
                  toEmail={appeal.contactEmail}
                  subject={appeal.direction === 'OUTBOUND' ? appeal.subject : `Re: ${appeal.subject}`}
                  fromEmail={fromEmail}
                  onFromEmailChange={setFromEmail}
                  mailboxOptions={mailboxOptions}
                  mailboxesLoading={mailboxesLoading}
                  mailboxesError={mailboxesError}
                  htmlContent={emailHtml}
                  onHtmlChange={setEmailHtml}
                  loading={sending}
                  onSend={handleSendEmail}
                  onCancel={emailMessages.length > 0 ? () => { setShowComposer(false); setEmailHtml(''); } : undefined}
                  disabled={isClosed}
                />
              ) : (
                <Button
                  type="primary" ghost icon={<SendOutlined />}
                  onClick={() => setShowComposer(true)}
                  style={{ borderRadius: 8, width: '100%', height: 40 }}
                >
                  Написать ответ
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Non-email layout: sidebar + chat */
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <div style={{ width: 280, flexShrink: 0 }}>
            {infoRow}
          </div>

          {/* Chat thread */}
          <div style={{
            flex: 1, background: '#fff', border: '1.5px solid #f0f0f0',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Переписка</span>
              <Tag style={{ borderRadius: 20, fontSize: 11 }}>{messagesPage?.totalElements ?? 0}</Tag>
            </div>

            <div style={{
              padding: '16px 20px', background: '#fafafa',
              display: 'flex', flexDirection: 'column', gap: 14,
              minHeight: 300, maxHeight: 520, overflowY: 'auto',
            }}>
              {msgsLoading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
              {!msgsLoading && messagesList.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bfbfbf', padding: 40 }}>
                  Сообщений пока нет
                </div>
              )}
              {messagesList.map((msg) => <ChatBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
              {isClosed ? (
                <div style={{ textAlign: 'center', color: '#52c41a', fontSize: 13, fontWeight: 500 }}>
                  Обращение закрыто — переписка завершена
                </div>
              ) : !canReply ? (
                <Alert
                  type="info"
                  showIcon
                  message="Отправка сообщения сейчас недоступна"
                  description={replyHint || 'Чтобы отправить сообщение, возьмите обращение в работу.'}
                  style={{ borderRadius: 8 }}
                />
              ) : (
                <>
                  <ChatComposer
                    channel={appeal.channel}
                    content={chatContent}
                    onChange={setChatContent}
                    loading={sending}
                    disabled={isClosed}
                    onSend={handleSendChat}
                  />
                  <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 5 }}>
                    Enter — отправить · Shift+Enter — новая строка
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ─────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><UserSwitchOutlined />Назначить оператора</Space>}
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); setAssignTargetValue(null); }}
        onOk={handleAssign}
        okText="Назначить" cancelText="Отмена"
        confirmLoading={assigning}
        okButtonProps={{ disabled: !assignTargetValue }}
        width={740}
      >
        {refsLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}><Spin tip="Загрузка групп..." /></div>
        ) : (
          <Radio.Group
            value={assignTargetValue ?? undefined}
            onChange={(e) => setAssignTargetValue(e.target.value)}
            style={{ width: '100%', marginTop: 8 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Группа назначения', groups: groupsWithOperators?.assignmentGroups ?? [], kind: 'assignmentGroup' },
                { label: 'Скилл-группа', groups: groupsWithOperators?.skillGroups ?? [], kind: 'skillGroup' },
              ].map(({ label, groups, kind }) => (
                <div key={kind}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 600, marginBottom: 8 }}>{label}</div>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {groups.length === 0 && <div style={{ fontSize: 12, color: '#bfbfbf' }}>Нет доступных групп</div>}
                    {groups.map((g) => (
                      <div key={g.id} style={{ border: '1px solid #f0f0f0', background: '#fafafa', borderRadius: 10, padding: '10px 12px' }}>
                        <Radio value={`${kind}:${g.id}`} style={{ fontWeight: 600 }}>{g.name}</Radio>
                        <div style={{ marginLeft: 24, marginTop: 8 }}>
                          {g.operators.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#bfbfbf' }}>Нет операторов</div>
                          ) : (
                            <Space direction="vertical" size={5}>
                              {g.operators.map((op) => (
                                <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                  <Radio value={`operator:${op.id}`} />
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{operatorFullName(op)}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{op.username}</div>
                                  </div>
                                </label>
                              ))}
                            </Space>
                          )}
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              ))}
            </div>
          </Radio.Group>
        )}
      </Modal>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><EditOutlined />Редактировать обращение</Space>}
        open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={handleEdit} okText="Сохранить" cancelText="Отмена"
        confirmLoading={updating} width={700} destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Тема *" validateStatus={editErrors.subject ? 'error' : ''} help={editErrors.subject?.message}>
            <Controller name="subject" control={editControl}
              render={({ field }) => <Input {...field} maxLength={512} />} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Канал">
                <Controller name="channel" control={editControl}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}
                      options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                  )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Приоритет">
                <Controller name="priority" control={editControl}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}
                      options={Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                  )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Тематика">
                <Controller name="topicId" control={editControl}
                  render={({ field }) => (
                    <Select {...field} allowClear style={{ width: '100%' }}
                      placeholder="Тематика" showSearch optionFilterProp="label"
                      options={topicSelectOptions}
                    />
                  )} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Имя контакта">
                <Controller name="contactName" control={editControl}
                  render={({ field }) => <Input {...field} />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" validateStatus={editErrors.contactEmail ? 'error' : ''}
                help={editErrors.contactEmail?.message as string}>
                <Controller name="contactEmail" control={editControl}
                  render={({ field }) => <Input {...field} />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Телефон">
                <Controller name="contactPhone" control={editControl}
                  render={({ field }) => <Input {...field} maxLength={32} />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Организация">
                <Controller name="organizationId" control={editControl}
                  render={({ field }) => (
                    <Select {...field} allowClear style={{ width: '100%' }}
                      placeholder="Организация" showSearch optionFilterProp="label"
                      options={(orgsPage?.content ?? []).map((o) => ({ value: o.id, label: o.name }))}
                    />
                  )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Группа назначения">
                <Controller name="assignmentGroupId" control={editControl}
                  render={({ field }) => (
                    <Select {...field} allowClear style={{ width: '100%' }}
                      options={(agPage?.content ?? []).map((g) => ({ value: g.id, label: g.name }))}
                    />
                  )} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Скилл-группа">
                <Controller name="skillGroupId" control={editControl}
                  render={({ field }) => (
                    <Select {...field} allowClear style={{ width: '100%' }}
                      options={(sgPage?.content ?? []).map((g) => ({ value: g.id, label: g.name }))}
                    />
                  )} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Описание">
            <Controller name="description" control={editControl}
              render={({ field }) => <Input.TextArea {...field} rows={3} />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
