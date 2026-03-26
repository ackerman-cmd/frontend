import React, { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select,
  message, Tooltip, Tag, Switch, Card, Row, Col, Empty,
} from 'antd';
import {
  PlusOutlined, EditOutlined, ReloadOutlined, TagOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useGetAllTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useSetTopicActiveMutation,
} from '../../shared/api/appealTopicsApi';
import type { AppealTopic, AppealTopicCategory } from '../../entities/appealTopic/model/types';
import { TOPIC_CATEGORY_LABELS, TOPIC_CATEGORY_ICONS } from '../../entities/appealTopic/model/types';
import { useAuth } from '../../shared/hooks/useAuth';

const { Title } = Typography;

const CATEGORY_OPTIONS = (Object.entries(TOPIC_CATEGORY_LABELS) as [AppealTopicCategory, string][]).map(
  ([k, v]) => ({ value: k, label: `${TOPIC_CATEGORY_ICONS[k]} ${v}` })
);

const topicSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  category: z.enum([
    'ACCOUNT_AND_CARD', 'DIGITAL_BANKING', 'PAYMENTS_AND_TRANSFERS',
    'LOANS_AND_CREDITS', 'SECURITY', 'TECHNICAL_ISSUES', 'GENERAL',
  ]),
  description: z.string().optional(),
});
type TopicFormValues = z.infer<typeof topicSchema>;

const CATEGORY_TAG_COLORS: Record<AppealTopicCategory, string> = {
  ACCOUNT_AND_CARD: 'blue',
  DIGITAL_BANKING: 'cyan',
  PAYMENTS_AND_TRANSFERS: 'green',
  LOANS_AND_CREDITS: 'orange',
  SECURITY: 'red',
  TECHNICAL_ISSUES: 'volcano',
  GENERAL: 'default',
};

export default function AppealTopicsPage() {
  const { isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppealTopic | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const { data: topics = [], isLoading, isFetching, refetch } = useGetAllTopicsQuery();
  const [createTopic, { isLoading: creating }] = useCreateTopicMutation();
  const [updateTopic, { isLoading: updating }] = useUpdateTopicMutation();
  const [setActive] = useSetTopicActiveMutation();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { name: '', description: '' },
  });

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (item: AppealTopic) => {
    setEditingItem(item);
    reset({ name: item.name, category: item.category, description: item.description ?? '' });
    setModalOpen(true);
  };

  const handleSave = handleSubmit(async (values) => {
    try {
      if (editingItem) {
        await updateTopic({ id: editingItem.id, body: values }).unwrap();
        message.success('Тематика обновлена');
      } else {
        await createTopic(values).unwrap();
        message.success('Тематика создана');
      }
      setModalOpen(false);
    } catch {
      message.error('Не удалось сохранить');
    }
  });

  const handleToggleActive = async (item: AppealTopic) => {
    try {
      await setActive({ id: item.id, active: !item.active }).unwrap();
      message.success(item.active ? 'Тематика деактивирована' : 'Тематика активирована');
    } catch {
      message.error('Не удалось изменить статус');
    }
  };

  const filtered = filterActive === undefined
    ? topics
    : topics.filter((t) => t.active === filterActive);

  // Group for stats
  const activeCount = topics.filter((t) => t.active).length;
  const inactiveCount = topics.length - activeCount;

  const columns: ColumnsType<AppealTopic> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {!record.active && <Tag color="default" style={{ fontSize: 10 }}>неактивна</Tag>}
        </Space>
      ),
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 230,
      render: (cat: AppealTopicCategory) => (
        <Tag
          color={CATEGORY_TAG_COLORS[cat] ?? 'default'}
          style={{ borderRadius: 10 }}
        >
          {TOPIC_CATEGORY_ICONS[cat]} {TOPIC_CATEGORY_LABELS[cat] ?? cat}
        </Tag>
      ),
      filters: CATEGORY_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v) => v ?? <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Обновлено',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      render: (v) => (
        <Tooltip title={dayjs(v).format('DD.MM.YYYY HH:mm')}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{dayjs(v).format('DD.MM.YY')}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Активна',
      dataIndex: 'active',
      key: 'active',
      width: 90,
      render: (active, record) => (
        <Switch
          checked={active}
          size="small"
          disabled={!isAdmin}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Да"
          unCheckedChildren="Нет"
        />
      ),
    },
    ...(isAdmin ? [{
      title: '',
      key: 'actions',
      width: 60,
      render: (_: any, record: AppealTopic) => (
        <Tooltip title="Редактировать">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Tooltip>
      ),
    }] : []),
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 10, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Тематики обращений</Title>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>Справочник тематик для классификации обращений</span>
          </div>
          <Space>
            <Tooltip title="Обновить">
              <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
            </Tooltip>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Добавить тематику
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8} sm={6} md={4}>
          <Card
            size="small" style={{ borderRadius: 10, cursor: 'pointer', border: filterActive === undefined ? '2px solid #1677ff' : '1px solid #f0f0f0' }}
            bodyStyle={{ textAlign: 'center', padding: '10px 16px' }}
            onClick={() => setFilterActive(undefined)}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}>{topics.length}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Всего</div>
          </Card>
        </Col>
        <Col xs={8} sm={6} md={4}>
          <Card
            size="small" style={{ borderRadius: 10, cursor: 'pointer', border: filterActive === true ? '2px solid #52c41a' : '1px solid #f0f0f0' }}
            bodyStyle={{ textAlign: 'center', padding: '10px 16px' }}
            onClick={() => setFilterActive(true)}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{activeCount}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Активных</div>
          </Card>
        </Col>
        <Col xs={8} sm={6} md={4}>
          <Card
            size="small" style={{ borderRadius: 10, cursor: 'pointer', border: filterActive === false ? '2px solid #ff4d4f' : '1px solid #f0f0f0' }}
            bodyStyle={{ textAlign: 'center', padding: '10px 16px' }}
            onClick={() => setFilterActive(false)}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{inactiveCount}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Неактивных</div>
          </Card>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={isLoading || isFetching}
        rowClassName={(record) => !record.active ? 'ant-table-row-disabled-row' : ''}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Тематики не найдены" /> }}
        style={{ opacity: isLoading ? 0.6 : 1 }}
        size="middle"
      />

      <Modal
        title={
          <Space>
            <TagOutlined />
            {editingItem ? 'Редактировать тематику' : 'Новая тематика'}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingItem ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={creating || updating}
        width={500}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Название *" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
            <Controller name="name" control={control}
              render={({ field }) => <Input {...field} maxLength={255} placeholder="Название тематики" />} />
          </Form.Item>
          <Form.Item label="Категория *" validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
            <Controller name="category" control={control}
              render={({ field }) => (
                <Select {...field} style={{ width: '100%' }} placeholder="Выберите категорию" options={CATEGORY_OPTIONS} />
              )} />
          </Form.Item>
          <Form.Item label="Описание">
            <Controller name="description" control={control}
              render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Краткое описание (необязательно)" />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
