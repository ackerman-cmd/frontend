import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Select, Input, Space, Modal, Form, Row, Col,
  Typography, Tooltip, Popconfirm, message, DatePicker, Card, Tag, Empty, Badge, Drawer, Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, PlayCircleOutlined,
  CloseCircleOutlined, StopOutlined, DeleteOutlined, ReloadOutlined,
  FilterOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, FireOutlined,
  MoreOutlined, RobotOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useFilterAppealsQuery,
  useCreateAppealMutation,
  useTakeAppealMutation,
  useCloseAppealMutation,
  useMarkAppealAsSpamMutation,
  useDeleteAppealMutation,
} from '../../shared/api/appealsApi';
import { useGetActiveTopicsQuery } from '../../shared/api/appealTopicsApi';
import type { AppealResponse, AppealFilterRequest } from '../../entities/appeal/model/types';
import {
  AppealStatusBadge, AppealPriorityBadge, AppealChannelTag,
  STATUS_LABELS, PRIORITY_LABELS, CHANNEL_LABELS, DIRECTION_LABELS,
} from '../../entities/appeal/ui/AppealBadges';
import { useAuth } from '../../shared/hooks/useAuth';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const createSchema = z.object({
  subject: z.string().min(1, 'Обязательное поле').max(512),
  description: z.string().optional(),
  channel: z.enum(['EMAIL', 'CHAT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Некорректный email').optional().or(z.literal('')),
  contactPhone: z.string().max(32).optional(),
  topicId: z.string().uuid().optional().or(z.literal('')),
});
type CreateFormValues = z.infer<typeof createSchema>;

interface Filters {
  status?: string;
  channel?: string;
  direction?: string;
  priority?: string;
  subject?: string;
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

const QUICK_STATUS_FILTERS: Array<{ value?: string; label: string }> = [
  { value: undefined, label: 'Все' },
  { value: 'PENDING_PROCESSING', label: 'Ожидают' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'WAITING_CLIENT_RESPONSE', label: 'На удержании' },
  { value: 'CLOSED', label: 'Закрытые' },
];

const formatPhoneRu = (rawValue: string): string => {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';

  let normalized = digits;
  if (normalized.startsWith('8')) normalized = `7${normalized.slice(1)}`;
  if (!normalized.startsWith('7')) normalized = `7${normalized}`;
  normalized = normalized.slice(0, 11);

  const p1 = normalized.slice(1, 4);
  const p2 = normalized.slice(4, 7);
  const p3 = normalized.slice(7, 9);
  const p4 = normalized.slice(9, 11);

  let result = '+7';
  if (p1) result += ` (${p1}`;
  if (p1.length === 3) result += ')';
  if (p2) result += ` ${p2}`;
  if (p3) result += `-${p3}`;
  if (p4) result += `-${p4}`;
  return result;
};

export default function AppealsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Filters>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [detailFiltersOpen, setDetailFiltersOpen] = useState(false);

  // Used only in the create form — NOT sent to the filter API
  const { data: activeTopics } = useGetActiveTopicsQuery();
  const topicSelectOptions = (activeTopics ?? []).map((topic) => ({
    value: topic.id,
    label: topic.name,
  }));

  const filterRequest: AppealFilterRequest = {
    page,
    size: pageSize,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    ...(filters.status && { status: filters.status as any }),
    ...(filters.channel && { channel: filters.channel as any }),
    ...(filters.direction && { direction: filters.direction as any }),
    ...(filters.priority && { priority: filters.priority as any }),
    ...(filters.subject && { subject: filters.subject }),
    ...(filters.dateRange?.[0] && { createdFrom: filters.dateRange[0].toISOString() }),
    ...(filters.dateRange?.[1] && { createdTo: filters.dateRange[1].toISOString() }),
  };

  const { data, isLoading, isFetching, refetch } = useFilterAppealsQuery(filterRequest);
  const [createAppeal, { isLoading: creating }] = useCreateAppealMutation();
  const [takeAppeal] = useTakeAppealMutation();
  const [closeAppeal] = useCloseAppealMutation();
  const [markAsSpam] = useMarkAppealAsSpamMutation();
  const [deleteAppeal] = useDeleteAppealMutation();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { channel: 'EMAIL', priority: 'MEDIUM' },
  });

  const setFilter = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const clearFilters = () => { setFilters({}); setPage(0); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const currentItems = React.useMemo(() => data?.content ?? [], [data?.content]);
  const pageStats = React.useMemo(() => ({
    total: currentItems.length,
    pending: currentItems.filter((item) => item.status === 'PENDING_PROCESSING').length,
    inProgress: currentItems.filter((item) => item.status === 'IN_PROGRESS').length,
    resolved: currentItems.filter((item) => item.status === 'CLOSED').length,
    critical: currentItems.filter((item) => item.priority === 'CRITICAL').length,
  }), [currentItems]);

  const handleCreate = handleSubmit(async (values) => {
    try {
      const created = await createAppeal({
        subject: values.subject,
        description: values.description || undefined,
        channel: values.channel,
        direction: 'OUTBOUND',
        priority: values.priority,
        contactName: values.contactName || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        topicId: values.topicId || undefined,
      }).unwrap();
      message.success('Обращение создано');
      setCreateOpen(false);
      reset();
      navigate(`/appeals/${created.id}`);
    } catch {
      message.error('Не удалось создать обращение');
    }
  });

  const handleTake = async (id: string) => {
    try { await takeAppeal(id).unwrap(); message.success('Взято в работу'); }
    catch { message.error('Не удалось взять обращение'); }
  };

  const handleClose = async (id: string) => {
    try { await closeAppeal(id).unwrap(); message.success('Обращение закрыто'); }
    catch { message.error('Не удалось закрыть'); }
  };

  const handleSpam = async (id: string) => {
    try { await markAsSpam(id).unwrap(); message.success('Помечено как спам'); }
    catch { message.error('Операция недоступна'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAppeal(id).unwrap(); message.success('Удалено'); }
    catch { message.error('Не удалось удалить'); }
  };

  const columns: ColumnsType<AppealResponse> = [
    {
      title: 'Обращение',
      key: 'subject',
      ellipsis: true,
      render: (_, record) => (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/appeals/${record.id}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <AppealChannelTag channel={record.channel} />
            <span style={{
              fontWeight: 600, fontSize: 13, color: '#1f1f1f',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340,
            }}>
              {record.subject}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {record.topic && (
              <Tag color="geekblue" style={{ fontSize: 11, borderRadius: 8, margin: 0 }}>
                {record.topic.name}
              </Tag>
            )}
            {record.contactEmail && (
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                {record.contactEmail}
              </span>
            )}
            {record.summary && (
              <Tooltip title={record.summary} placement="bottomLeft">
                <span style={{ fontSize: 11, color: '#722ed1', cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <RobotOutlined />
                  <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {record.summary}
                  </span>
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (v) => <AppealStatusBadge status={v} size="small" />,
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 115,
      render: (v) => <AppealPriorityBadge priority={v} size="small" />,
    },
    {
      title: 'Оператор',
      key: 'operator',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.assignedOperator
        ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#1677ff',
              color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r.assignedOperator.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.assignedOperator.fullName}
              </div>
            </div>
          </div>
        )
        : <span style={{ fontSize: 12, color: '#bfbfbf' }}>Не назначен</span>,
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v) => (
        <Tooltip title={dayjs(v).format('DD.MM.YYYY HH:mm:ss')}>
          <span style={{ fontSize: 12, color: '#595959' }}>{dayjs(v).format('DD.MM.YY HH:mm')}</span>
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const canClose = record.status !== 'CLOSED' && record.status !== 'SPAM';
        const menuItems: MenuProps['items'] = [
          {
            key: 'open',
            icon: <EyeOutlined />,
            label: 'Открыть',
            onClick: () => navigate(`/appeals/${record.id}`),
          },
          ...(record.status === 'PENDING_PROCESSING' ? [{
            key: 'take',
            icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
            label: 'Взять в работу',
            onClick: () => handleTake(record.id),
          }] : []),
          ...(canClose ? [
            { type: 'divider' as const },
            {
              key: 'close',
              icon: <CloseCircleOutlined />,
              label: (
                <Popconfirm
                  title="Закрыть обращение?"
                  onConfirm={() => handleClose(record.id)}
                  okText="Да" cancelText="Нет"
                >
                  <span onClick={(e) => e.stopPropagation()}>Закрыть</span>
                </Popconfirm>
              ),
            },
            {
              key: 'spam',
              icon: <StopOutlined style={{ color: '#ff4d4f' }} />,
              label: (
                <Popconfirm
                  title="Пометить как спам?"
                  onConfirm={() => handleSpam(record.id)}
                  okText="Да" cancelText="Нет"
                >
                  <span style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()}>Спам</span>
                </Popconfirm>
              ),
            },
          ] : []),
          ...(isAdmin ? [
            { type: 'divider' as const },
            {
              key: 'delete',
              icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
              label: (
                <Popconfirm
                  title="Удалить обращение?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Удалить" okButtonProps={{ danger: true }} cancelText="Нет"
                >
                  <span style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()}>Удалить</span>
                </Popconfirm>
              ),
            },
          ] : []),
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              icon={<MoreOutlined />}
              style={{ borderRadius: 6 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      {/* Header */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: '16px 18px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>Обращения</Title>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              Показано {pageStats.total} из {data?.totalElements ?? 0}
            </span>
          </div>
          <Space>
            <Tooltip title="Обновить">
              <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Создать обращение
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag icon={<ClockCircleOutlined />} color="gold">Ожидают: {pageStats.pending}</Tag>
          <Tag icon={<SyncOutlined spin />} color="blue">В работе: {pageStats.inProgress}</Tag>
          <Tag icon={<CheckCircleOutlined />} color="green">Закрыто: {pageStats.resolved}</Tag>
          {pageStats.critical > 0 && (
            <Tag icon={<FireOutlined />} color="red">Критичных: {pageStats.critical}</Tag>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        bodyStyle={{ paddingBottom: 12 }}
        title={
          <Space size={8}>
            <FilterOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>Фильтры</span>
            {activeFilterCount > 0 && (
              <Badge count={activeFilterCount} style={{ backgroundColor: '#1677ff' }} />
            )}
          </Space>
        }
        extra={
          <Space>
            {activeFilterCount > 0 && (
              <Button size="small" onClick={clearFilters} type="link">Сбросить всё</Button>
            )}
            <Button
              size="small"
              icon={<FilterOutlined />}
              onClick={() => setDetailFiltersOpen(true)}
              style={{ borderRadius: 10 }}
            >
              Расширенные
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {QUICK_STATUS_FILTERS.map((item) => {
            const active = (filters.status ?? undefined) === item.value;
            return (
              <Button
                key={item.label}
                size="small"
                type={active ? 'primary' : 'default'}
                ghost={!active}
                onClick={() => setFilter({ status: item.value })}
                style={{ borderRadius: 999, flexShrink: 0 }}
              >
                {item.label}
              </Button>
            );
          })}
          <Input
            placeholder="Поиск по теме обращения"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={filters.subject}
            onChange={(e) => setFilter({ subject: e.target.value })}
            allowClear
            style={{ width: 320, minWidth: 220, marginLeft: 8 }}
          />
        </div>
      </Card>

      <Drawer
        title="Расширенные фильтры"
        placement="right"
        width={420}
        open={detailFiltersOpen}
        onClose={() => setDetailFiltersOpen(false)}
        extra={(
          <Space>
            <Button
              onClick={() => {
                clearFilters();
                setDetailFiltersOpen(false);
              }}
            >
              Сбросить
            </Button>
            <Button type="primary" onClick={() => setDetailFiltersOpen(false)}>
              Применить
            </Button>
          </Space>
        )}
      >
        <Row gutter={[12, 12]}>
          <Col span={24}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Статус</div>
            <Select allowClear placeholder="Все статусы" style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => setFilter({ status: v })}
              options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Col>
          <Col span={24}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Приоритет</div>
            <Select allowClear placeholder="Все" style={{ width: '100%' }}
              value={filters.priority}
              onChange={(v) => setFilter({ priority: v })}
              options={Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Col>
          <Col span={24}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Канал</div>
            <Select allowClear placeholder="Все каналы" style={{ width: '100%' }}
              value={filters.channel}
              onChange={(v) => setFilter({ channel: v })}
              options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Col>
          <Col span={24}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Направление</div>
            <Select allowClear placeholder="Все" style={{ width: '100%' }}
              value={filters.direction}
              onChange={(v) => setFilter({ direction: v })}
              options={Object.entries(DIRECTION_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Col>
          <Col span={24}>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>Период создания</div>
            <RangePicker style={{ width: '100%' }}
              value={filters.dateRange as any}
              onChange={(v) => setFilter({ dateRange: v as any })}
              format="DD.MM.YYYY"
              placeholder={['От', 'До']}
            />
          </Col>
        </Row>
      </Drawer>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={currentItems}
        loading={isLoading || isFetching}
        scroll={{ x: 1100 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                activeFilterCount > 0
                  ? 'По заданным фильтрам обращений не найдено'
                  : 'Обращений пока нет'
              }
            />
          ),
        }}
        rowClassName={(record) => record.priority === 'CRITICAL' ? 'ant-table-row-critical' : ''}
        size="middle"
        pagination={{
          current: page + 1,
          pageSize,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}–${range[1]} из ${total}`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (p, s) => { setPage(p - 1); setPageSize(s); },
        }}
      />

      {/* Create Modal */}
      <Modal
        title={<Space><PlusOutlined />Новое обращение</Space>}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); reset(); }}
        onOk={handleCreate}
        okText="Создать обращение"
        cancelText="Отмена"
        confirmLoading={creating}
        width={680}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Тема *" validateStatus={errors.subject ? 'error' : ''} help={errors.subject?.message}>
            <Controller name="subject" control={control}
              render={({ field }) => <Input {...field} placeholder="Кратко опишите проблему" maxLength={512} />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Канал *">
                <Controller name="channel" control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}
                      options={Object.entries(CHANNEL_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                  )} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Приоритет *">
                <Controller name="priority" control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}
                      options={Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
                  )} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Тематика">
            <Controller name="topicId" control={control}
              render={({ field }) => (
                <Select {...field} allowClear style={{ width: '100%' }}
                  placeholder="Выберите тематику обращения"
                  showSearch optionFilterProp="label"
                  options={topicSelectOptions}
                />
              )} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Имя контакта">
                <Controller name="contactName" control={control}
                  render={({ field }) => <Input {...field} placeholder="ФИО" />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" validateStatus={errors.contactEmail ? 'error' : ''} help={errors.contactEmail?.message}>
                <Controller name="contactEmail" control={control}
                  render={({ field }) => <Input {...field} placeholder="email@example.com" />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Телефон">
                <Controller name="contactPhone" control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(formatPhoneRu(e.target.value))}
                      onBlur={field.onBlur}
                      placeholder="+7 (___) ___-__-__"
                      maxLength={18}
                    />
                  )} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Описание">
            <Controller name="description" control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={3} placeholder="Подробное описание проблемы или запроса" />
              )} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
