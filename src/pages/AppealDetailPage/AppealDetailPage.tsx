import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Space, Spin, Alert, Descriptions, Card, Input, Select,
  Modal, message, Popconfirm, Form, Row, Col, Tooltip, Tag, Divider,
  Typography, Badge, Radio,
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, CloseCircleOutlined, StopOutlined,
  UserSwitchOutlined, SendOutlined, EditOutlined, DeleteOutlined,
  TagOutlined, UserOutlined, BankOutlined, TeamOutlined, SwapOutlined,
  ReloadOutlined, MoreOutlined,
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
  useChangeAppealStatusMutation,
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
import type { OperatorSummaryResponse } from '../../entities/groupReference/model/types';
import type { AppealStatus, AppealUpdateRequest } from '../../entities/appeal/model/types';
import {
  AppealStatusBadge, AppealPriorityBadge, AppealChannelTag, AppealDirectionTag,
  STATUS_LABELS, PRIORITY_LABELS, CHANNEL_LABELS,
} from '../../entities/appeal/ui/AppealBadges';
import type { AppealTopicCategory } from '../../entities/appealTopic/model/types';
import { TOPIC_CATEGORY_LABELS, TOPIC_CATEGORY_ICONS } from '../../entities/appealTopic/model/types';
import { useAuth } from '../../shared/hooks/useAuth';

const { Title, Text } = Typography;

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const msgSchema = z.object({
  content: z.string().min(1, 'Введите текст сообщения'),
  channel: z.enum(['EMAIL', 'LETTER', 'CALL', 'CHAT']),
});
type MsgFormValues = z.infer<typeof msgSchema>;

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

// ─── Action → handler mapping ─────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  TAKE_INTO_WORK: <PlayCircleOutlined />,
  TAKE_IN_WORK: <PlayCircleOutlined />,
  ASSIGN_OPERATOR: <UserSwitchOutlined />,
  CLOSE: <CloseCircleOutlined />,
  MARK_AS_SPAM: <StopOutlined />,
};

const ACTION_TYPE: Record<string, 'primary' | 'default' | 'dashed'> = {
  TAKE_INTO_WORK: 'primary',
  TAKE_IN_WORK: 'primary',
  ASSIGN_OPERATOR: 'default',
  CLOSE: 'default',
  MARK_AS_SPAM: 'dashed',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgInputRef = useRef<HTMLTextAreaElement>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetValue, setAssignTargetValue] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: appeal, isLoading, isError, refetch } = useGetAppealByIdQuery(id!, { skip: !id });
  const { data: messagesPage, isLoading: msgsLoading } = useGetAppealMessagesQuery(
    { id: id! },
    { skip: !id, pollingInterval: 15000 },
  );
  const {
    data: actionsData,
    refetch: refetchActions,
  } = useGetAvailableActionsQuery(id!, {
    skip: !id,
    pollingInterval: 3000, // чтобы быстрое тыкание кнопок не использовало устаревший enabled/hint
  });
  const { data: groupedTopics } = useGetGroupedTopicsQuery();
  const { data: groupsWithOperators, isLoading: refsLoading } = useGetGroupsWithOperatorsQuery(undefined, {
    skip: !assignModalOpen,
  });
  const { data: orgsPage } = useGetOrganizationsQuery({ size: 200 });
  const { data: agPage } = useGetAssignmentGroupsQuery({ size: 200 });
  const { data: sgPage } = useGetSkillGroupsQuery({ size: 200 });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [takeAppeal, { isLoading: taking }] = useTakeAppealMutation();
  const [closeAppeal, { isLoading: closing }] = useCloseAppealMutation();
  const [markAsSpam, { isLoading: spamming }] = useMarkAppealAsSpamMutation();
  const [assignOperator, { isLoading: assigning }] = useAssignOperatorMutation();
  const [changeStatus] = useChangeAppealStatusMutation();
  const [sendMessage, { isLoading: sending }] = useSendOperatorMessageMutation();
  const [updateAppeal, { isLoading: updating }] = useUpdateAppealMutation();
  const [deleteAppeal] = useDeleteAppealMutation();

  // ── Forms ──────────────────────────────────────────────────────────────────
  const {
    control: msgControl, handleSubmit: handleMsgSubmit, reset: resetMsg,
    formState: { errors: msgErrors },
  } = useForm<MsgFormValues>({
    resolver: zodResolver(msgSchema),
    defaultValues: { channel: 'EMAIL' },
  });

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
      resetMsg({ channel: appeal.channel });
    }
  }, [appeal, resetEdit, resetMsg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesPage]);

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
        action={<Button onClick={() => navigate('/appeals')}>К списку обращений</Button>}
        style={{ maxWidth: 560 }}
      />
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTake = async () => {
    try { await takeAppeal(id).unwrap(); message.success('Обращение взято в работу'); }
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
      if (kind === 'operator') {
        await assignOperator({ id, operatorId: targetId }).unwrap();
        message.success('Оператор назначен');
      } else if (kind === 'assignmentGroup') {
        await assignOperator({ id, assignmentGroupId: targetId }).unwrap();
        message.success('Группа назначения назначена');
      } else if (kind === 'skillGroup') {
        await assignOperator({ id, skillGroupId: targetId }).unwrap();
        message.success('Скилл-группа назначена');
      } else {
        message.error('Некорректный вариант назначения');
        return;
      }
      setAssignModalOpen(false);
      setAssignTargetValue(null);
    } catch { message.error('Не удалось назначить'); }
    finally { refetchActions(); }
  };

  const handleStatusChange = async (newStatus: AppealStatus) => {
    try {
      await changeStatus({ id, status: newStatus }).unwrap();
      message.success(`Статус: ${STATUS_LABELS[newStatus]}`);
    } catch { message.error('Не удалось изменить статус'); }
    finally { refetchActions(); }
  };

  const handleSendMessage = handleMsgSubmit(async (values) => {
    try {
      await sendMessage({ id, body: { content: values.content, channel: values.channel } }).unwrap();
      resetMsg({ channel: appeal.channel });
    } catch { message.error('Не удалось отправить сообщение'); }
  });

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
    try {
      await updateAppeal({ id, body }).unwrap();
      message.success('Обращение обновлено');
      setEditOpen(false);
    } catch { message.error('Не удалось обновить обращение'); }
  });

  const handleDelete = async () => {
    try {
      await deleteAppeal(id).unwrap();
      message.success('Обращение удалено');
      refetchActions();
      navigate('/appeals');
    } catch { message.error('Не удалось удалить'); }
  };

  // Map action code → handler
  const handleAction = (action: string) => {
    switch (action) {
      case 'TAKE_INTO_WORK': return handleTake();
      case 'TAKE_IN_WORK': return handleTake();
      case 'ASSIGN_OPERATOR': return setAssignModalOpen(true);
      case 'CLOSE': return handleClose();
      case 'MARK_AS_SPAM': return handleSpam();
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const actions = actionsData?.actions ?? [];
  const headerActions = actions.filter((a) => {
    return (
      a.action === 'TAKE_INTO_WORK' ||
      a.action === 'TAKE_IN_WORK' ||
      a.action === 'ASSIGN_OPERATOR' ||
      a.action === 'CLOSE' ||
      a.action === 'MARK_AS_SPAM'
    );
  });
  const availableTransitions = actionsData?.availableStatusTransitions ?? [];
  const messages_list = messagesPage?.content ?? [];

  const topicSelectOptions = Object.entries(groupedTopics ?? {}).flatMap(([category, rawTopics]) => {
    const items: any[] = Array.isArray(rawTopics) ? rawTopics : [];
    if (items.length === 0) return [];
    const cat = category as AppealTopicCategory;
    return [{
      label: `${TOPIC_CATEGORY_ICONS[cat] ?? ''} ${TOPIC_CATEGORY_LABELS[cat] ?? category}`,
      options: items.map((t) => ({ value: t.id, label: t.name })),
    }];
  });

  // ── Card styles ────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  };

  const operatorFullName = (op: OperatorSummaryResponse) => (
    [op.firstName, op.lastName].filter(Boolean).join(' ') || op.username
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/appeals')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                marginBottom: 6,
                fontSize: 12,
                color: '#8c8c8c',
                cursor: 'pointer',
              }}
            >
              <ArrowLeftOutlined style={{ marginRight: 6 }} />
              вернуться к обращениям
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                {appeal.subject}
              </Title>
              {appeal.topic && (
                <Tag icon={<TagOutlined />} color="geekblue" style={{ borderRadius: 10, margin: 0 }}>
                  {appeal.topic.name}
                </Tag>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <AppealStatusBadge status={appeal.status} />
              <AppealPriorityBadge priority={appeal.priority} />
              <AppealChannelTag channel={appeal.channel} />
              <AppealDirectionTag direction={appeal.direction} />
            </div>

            {/* Dynamic action buttons */}
            <Space wrap size={8}>
              {headerActions.map((act) => {
                const isDanger = act.action === 'MARK_AS_SPAM';
                const isConfirm = act.action === 'CLOSE' || act.action === 'MARK_AS_SPAM';
                const isEnabled = Boolean(act.enabled);
                const isTakeAction = act.action === 'TAKE_IN_WORK' || act.action === 'TAKE_INTO_WORK';
                const takeDisabledByStatus = isTakeAction && appeal.status === 'IN_PROGRESS';
                const finalDisabled = takeDisabledByStatus || !isEnabled;
                const hintText = act.hint ?? act.description;

                const btn = (
                  <Tooltip
                    key={`${act.action}-tooltip`}
                    title={isEnabled ? act.description : hintText}
                  >
                    <span>
                      <Button
                        key={act.action}
                        type={ACTION_TYPE[act.action] ?? 'default'}
                        icon={ACTION_ICONS[act.action]}
                        danger={isDanger}
                        disabled={finalDisabled}
                        style={
                          isTakeAction && takeDisabledByStatus
                            ? {
                              background: '#e6f4ff',
                              borderColor: '#91caff',
                              color: '#1677ff',
                              opacity: 0.75,
                            }
                            : undefined
                        }
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
                    <Popconfirm
                      key={act.action}
                      title={`${act.label}?`}
                      description={hintText}
                      onConfirm={() => handleAction(act.action)}
                      okText="Да" cancelText="Нет"
                      okButtonProps={{ danger: isDanger }}
                    >
                      {btn}
                    </Popconfirm>
                  );
                }

                return btn;
              })}

              {/* Status transitions */}
              {availableTransitions.length > 0 && (
                <Select
                  placeholder={<><SwapOutlined /> Сменить статус</>}
                  style={{ minWidth: 180 }}
                  value={undefined}
                  onChange={(v) => v && handleStatusChange(v as unknown as AppealStatus)}
                  options={availableTransitions.map((t) => ({
                    value: t.status,
                    label: (
                      <Space size={6}>
                        <SwapOutlined style={{ color: '#888' }} />
                        {t.label}
                      </Space>
                    ),
                  }))}
                />
              )}
            </Space>
          </div>

          <Space>
            <Tooltip title="Обновить">
              <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
            </Tooltip>
            {(() => {
              const editAction = actionsData?.actions?.find((a) => a.action === 'EDIT');
              const deleteAction = actionsData?.actions?.find((a) => a.action === 'DELETE');

              const editEnabled = editAction ? editAction.enabled : true;
              const deleteEnabled = deleteAction ? deleteAction.enabled : isAdmin;
              const editHint = editAction?.hint ?? 'Редактирование доступно';
              const deleteHint = deleteAction?.hint ?? 'Удаление недоступно';

              return (
                <>
                  <Tooltip title={editEnabled ? 'Редактировать' : editHint}>
                    <span>
                      <Button
                        icon={<EditOutlined />}
                        disabled={!editEnabled}
                        onClick={() => editEnabled && setEditOpen(true)}
                      />
                    </span>
                  </Tooltip>

                  <Tooltip title={deleteEnabled ? 'Удалить обращение' : deleteHint}>
                    <span>
                      {deleteEnabled ? (
                        <Popconfirm
                          title="Удалить обращение?"
                          description="Это действие необратимо."
                          onConfirm={handleDelete}
                          okText="Удалить" okButtonProps={{ danger: true }}
                          cancelText="Отмена"
                        >
                          <Button danger icon={<DeleteOutlined />} disabled={!deleteEnabled} />
                        </Popconfirm>
                      ) : (
                        <Button danger icon={<DeleteOutlined />} disabled />
                      )}
                    </span>
                  </Tooltip>
                </>
              );
            })()}
          </Space>
        </div>
      </Card>

      {/* ── INFO ROW ───────────────────────────────────────────────────────── */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Appeal details */}
        <Col xs={24} lg={12} style={{ marginBottom: 16 }}>
          <Card
            title={<Space><TagOutlined style={{ color: '#1677ff' }} />Детали обращения</Space>}
            style={{ ...cardStyle, height: '100%' }}
            size="small"
          >
            <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 140 }}>
              {appeal.topic && (
                <Descriptions.Item label="Тематика">
                  <Tag color="geekblue">{appeal.topic.name}</Tag>
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
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{appeal.description}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {appeal.organization && (
              <>
                <Divider style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  <BankOutlined style={{ color: '#1677ff' }} /> Организация
                </div>
                <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 140 }}>
                  <Descriptions.Item label="Название">{appeal.organization.name}</Descriptions.Item>
                  <Descriptions.Item label="ИНН">{appeal.organization.inn}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Card>
        </Col>

        {/* Contact + Assignment */}
        <Col xs={24} lg={12} style={{ marginBottom: 16 }}>
          <Card
            title={<Space><UserOutlined style={{ color: '#52c41a' }} />Контакт и назначение</Space>}
            style={{ ...cardStyle, height: '100%' }}
            size="small"
          >
            {(appeal.contactName || appeal.contactEmail || appeal.contactPhone) ? (
              <>
                <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 140 }}>
                  {appeal.contactName && <Descriptions.Item label="Имя">{appeal.contactName}</Descriptions.Item>}
                  {appeal.contactEmail && (
                    <Descriptions.Item label="Email">
                      <a href={`mailto:${appeal.contactEmail}`}>{appeal.contactEmail}</a>
                    </Descriptions.Item>
                  )}
                  {appeal.contactPhone && (
                    <Descriptions.Item label="Телефон">
                      <a href={`tel:${appeal.contactPhone}`}>{appeal.contactPhone}</a>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <Divider style={{ margin: '10px 0' }} />
              </>
            ) : (
              <div style={{ color: '#bfbfbf', marginBottom: 12, fontSize: 13 }}>Контактные данные не указаны</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
              <TeamOutlined style={{ color: '#fa8c16' }} /> Назначение
            </div>

            {appeal.assignedOperator ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: '#f6ffed',
                borderRadius: 8, border: '1px solid #b7eb8f', marginBottom: 8,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#52c41a', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {appeal.assignedOperator.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{appeal.assignedOperator.fullName}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{appeal.assignedOperator.email}</div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '8px 12px', background: '#fff7e6',
                borderRadius: 8, border: '1px solid #ffd591',
                color: '#d46b08', fontSize: 13, marginBottom: 8,
              }}>
                Оператор не назначен
              </div>
            )}

            <Button
              icon={<UserSwitchOutlined />} size="small"
              onClick={() => setAssignModalOpen(true)}
              style={{ marginBottom: 8 }}
            >
              {appeal.assignedOperator ? 'Переназначить' : 'Назначить оператора'}
            </Button>

            {(appeal.assignmentGroup || appeal.skillGroup) && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 140 }}>
                  {appeal.assignmentGroup && (
                    <Descriptions.Item label="Группа назначения">
                      <Tag color="blue">{appeal.assignmentGroup.name}</Tag>
                    </Descriptions.Item>
                  )}
                  {appeal.skillGroup && (
                    <Descriptions.Item label="Скилл-группа">
                      <Tag color="purple">{appeal.skillGroup.name}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── MESSAGES (full width, bottom) ──────────────────────────────────── */}
      <Card
        title={
          <Space>
            <Badge count={messagesPage?.totalElements ?? 0} style={{ backgroundColor: '#1677ff' }}>
              <span style={{ fontWeight: 600 }}>Переписка</span>
            </Badge>
          </Space>
        }
        style={{ ...cardStyle }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Thread */}
        <div style={{
          height: 420,
          overflowY: 'auto',
          padding: '16px 24px',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {msgsLoading && (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Загрузка сообщений..." /></div>
          )}
          {!msgsLoading && messages_list.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#bfbfbf', gap: 8,
            }}>
              <SendOutlined style={{ fontSize: 32, opacity: 0.3 }} />
              <span>Сообщений пока нет</span>
            </div>
          )}
          {messages_list.map((msg) => {
            const isOperator = msg.senderType === 'OPERATOR';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isOperator ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isOperator ? '#1677ff' : '#d9d9d9',
                  color: isOperator ? '#fff' : '#595959',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {isOperator
                    ? (msg.sender?.fullName ?? 'О').slice(0, 1).toUpperCase()
                    : 'К'}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '65%' }}>
                  <div style={{
                    fontSize: 11, color: '#8c8c8c', marginBottom: 3,
                    textAlign: isOperator ? 'right' : 'left',
                  }}>
                    {isOperator
                      ? (msg.sender?.fullName ?? 'Оператор')
                      : 'Клиент'}
                    {' · '}{dayjs(msg.createdAt).format('DD.MM HH:mm')}
                  </div>
                  <div style={{
                    background: isOperator ? '#1677ff' : '#fff',
                    color: isOperator ? '#fff' : '#1f1f1f',
                    border: isOperator ? 'none' : '1px solid #e8e8e8',
                    borderRadius: isOperator ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    marginTop: 3, textAlign: isOperator ? 'right' : 'left',
                  }}>
                    <Tag style={{ fontSize: 10, borderRadius: 8, margin: 0 }}>
                      {CHANNEL_LABELS[msg.channel] ?? msg.channel}
                    </Tag>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Send form */}
        {appeal.status !== 'CLOSED' && (
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
            borderRadius: '0 0 12px 12px',
          }}>
            <Form onFinish={handleSendMessage}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>Канал</div>
                  <Controller name="channel" control={msgControl}
                    render={({ field }) => (
                      <Select {...field} size="middle" style={{ width: '100%' }}
                        options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                    Сообщение {msgErrors.content && <span style={{ color: '#ff4d4f' }}>— {msgErrors.content.message}</span>}
                  </div>
                  <Controller name="content" control={msgControl}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        ref={msgInputRef as any}
                        rows={2}
                        placeholder="Введите ответ клиенту..."
                        onPressEnter={(e) => {
                          if (!e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        style={{ resize: 'none' }}
                      />
                    )}
                  />
                </div>
                <Button
                  htmlType="submit" type="primary" icon={<SendOutlined />}
                  loading={sending} size="large"
                  title="Отправить (Enter)"
                >
                  Отправить
                </Button>
              </div>
              <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4 }}>
                Enter — отправить · Shift+Enter — новая строка
              </div>
            </Form>
          </div>
        )}

        {appeal.status === 'CLOSED' && (
          <div style={{
            padding: '12px 24px', borderTop: '1px solid #f0f0f0',
            background: '#f6ffed', color: '#52c41a',
            borderRadius: '0 0 12px 12px', fontSize: 13, textAlign: 'center',
          }}>
            Обращение закрыто — переписка завершена
          </div>
        )}
      </Card>

      {/* ── ASSIGN MODAL ───────────────────────────────────────────────────── */}
      <Modal
        title="назначить"
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setAssignTargetValue(null);
        }}
        onOk={handleAssign}
        okText="Назначить"
        cancelText="Отмена"
        confirmLoading={assigning}
        okButtonProps={{ disabled: !assignTargetValue }}
        width={720}
      >
        {refsLoading ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Spin tip="Загрузка групп..." />
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <Radio.Group
              value={assignTargetValue ?? undefined}
              onChange={(e) => setAssignTargetValue(e.target.value)}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 600, marginBottom: 8 }}>
                    Группа назначения
                  </div>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    {(groupsWithOperators?.assignmentGroups ?? []).map((g) => (
                      <div
                        key={g.id}
                        style={{
                          border: '1px solid #f0f0f0',
                          background: '#fafafa',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        <Radio value={`assignmentGroup:${g.id}`} style={{ fontWeight: 600 }}>
                          {g.name}
                        </Radio>
                        <div style={{ marginLeft: 24, marginTop: 8 }}>
                          {g.operators.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#bfbfbf' }}>Нет операторов</div>
                          ) : (
                            <Space direction="vertical" size={6}>
                              {g.operators.map((op) => (
                                <label
                                  key={op.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 13,
                                  }}
                                >
                                  <Radio value={`operator:${op.id}`} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {operatorFullName(op)}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {op.username}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </Space>
                          )}
                        </div>
                      </div>
                    ))}
                    {(groupsWithOperators?.assignmentGroups ?? []).length === 0 && (
                      <div style={{ fontSize: 12, color: '#bfbfbf' }}>Группы назначения недоступны</div>
                    )}
                  </Space>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 600, marginBottom: 8 }}>
                    Скилл-группа
                  </div>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    {(groupsWithOperators?.skillGroups ?? []).map((g) => (
                      <div
                        key={g.id}
                        style={{
                          border: '1px solid #f0f0f0',
                          background: '#fafafa',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        <Radio value={`skillGroup:${g.id}`} style={{ fontWeight: 600 }}>
                          {g.name}
                        </Radio>
                        <div style={{ marginLeft: 24, marginTop: 8 }}>
                          {g.operators.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#bfbfbf' }}>Нет операторов</div>
                          ) : (
                            <Space direction="vertical" size={6}>
                              {g.operators.map((op) => (
                                <label
                                  key={op.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 13,
                                  }}
                                >
                                  <Radio value={`operator:${op.id}`} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {operatorFullName(op)}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {op.username}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </Space>
                          )}
                        </div>
                      </div>
                    ))}
                    {(groupsWithOperators?.skillGroups ?? []).length === 0 && (
                      <div style={{ fontSize: 12, color: '#bfbfbf' }}>Скилл-группы недоступны</div>
                    )}
                  </Space>
                </div>
              </div>
            </Radio.Group>
          </div>
        )}
      </Modal>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><EditOutlined />Редактировать обращение</Space>}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEdit}
        okText="Сохранить изменения"
        cancelText="Отмена"
        confirmLoading={updating}
        width={680}
        destroyOnClose
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
                    <Select
                      {...field} allowClear style={{ width: '100%' }}
                      placeholder="Выберите тематику"
                      showSearch optionFilterProp="label"
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
                      placeholder="Выберите организацию"
                      showSearch optionFilterProp="label"
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
                      placeholder="Группа"
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
                      placeholder="Скилл-группа"
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
