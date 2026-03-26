import React, { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select,
  message, Popconfirm, Tooltip, Tag, Card, Descriptions, Divider, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  MinusCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useGetAssignmentGroupsQuery,
  useCreateAssignmentGroupMutation,
  useGetAssignmentGroupByIdQuery,
  useUpdateAssignmentGroupMutation,
  useDeleteAssignmentGroupMutation,
  useRemoveOperatorFromAssignmentGroupMutation,
} from '../../shared/api/assignmentGroupsApi';
import { useListOperatorsQuery } from '../../shared/api/adminApi';
import type { AssignmentGroupResponse } from '../../entities/assignmentGroup/model/types';

const { Title } = Typography;

const groupSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  description: z.string().optional(),
  operatorIds: z.array(z.string()).min(1, 'Выберите хотя бы одного оператора'),
});
type GroupFormValues = z.infer<typeof groupSchema>;

function GroupDetailModal({
  groupId,
  open,
  onClose,
}: {
  groupId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: group, isLoading } = useGetAssignmentGroupByIdQuery(groupId!, { skip: !groupId });
  const [removeOperator] = useRemoveOperatorFromAssignmentGroupMutation();

  const handleRemove = async (operatorId: string) => {
    if (!groupId) return;
    try {
      await removeOperator({ id: groupId, operatorId }).unwrap();
      message.success('Оператор удалён из группы');
    } catch {
      message.error('Не удалось удалить оператора');
    }
  };

  return (
    <Modal
      title={<Space><TeamOutlined />{group ? `Группа: ${group.name}` : 'Группа'}</Space>}
      open={open}
      onCancel={onClose}
      footer={<Button style={{ borderRadius: 10 }} onClick={onClose}>Закрыть</Button>}
      width={520}
    >
      {isLoading ? <div>Загрузка...</div> : group ? (
        <>
          <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 140 }}>
            <Descriptions.Item label="Название">{group.name}</Descriptions.Item>
            {group.description && <Descriptions.Item label="Описание">{group.description}</Descriptions.Item>}
            <Descriptions.Item label="Создано">{dayjs(group.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Операторов">{group.operatorCount}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Операторы</div>
          {group.operators.length === 0 ? (
            <div style={{ color: '#aaa' }}>Нет операторов</div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {group.operators.map((op) => (
                <div key={op.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '8px 10px',
                }}>
                  <span>{op.fullName} <span style={{ color: '#aaa', fontSize: 12 }}>({op.username})</span></span>
                  <Tooltip title="Удалить из группы">
                    <Popconfirm
                      title={`Удалить ${op.fullName} из группы?`}
                      onConfirm={() => handleRemove(op.id)}
                      okText="Да" cancelText="Нет"
                    >
                      <Button size="small" danger icon={<MinusCircleOutlined />} />
                    </Popconfirm>
                  </Tooltip>
                </div>
              ))}
            </Space>
          )}
        </>
      ) : null}
    </Modal>
  );
}

export default function AssignmentGroupsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssignmentGroupResponse | null>(null);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [minOperators, setMinOperators] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetAssignmentGroupsQuery({ page, size: pageSize });
  const { data: operatorsPage } = useListOperatorsQuery();

  const [createGroup, { isLoading: creating }] = useCreateAssignmentGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateAssignmentGroupMutation();
  const [deleteGroup] = useDeleteAssignmentGroupMutation();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '', operatorIds: [] },
  });

  const operatorOptions = (operatorsPage?.content ?? []).map((u) => ({
    value: u.id,
    label: `${u.firstName ?? ''} ${u.lastName ?? ''} (${u.username})`.trim(),
  }));

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: '', description: '', operatorIds: [] });
    setModalOpen(true);
  };

  const openEdit = (item: AssignmentGroupResponse) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description ?? '',
      operatorIds: item.operators.map((o) => o.id),
    });
    setModalOpen(true);
  };

  const handleSave = handleSubmit(async (values) => {
    const body = {
      name: values.name,
      description: values.description || undefined,
      operatorIds: values.operatorIds,
    };
    try {
      if (editingItem) {
        await updateGroup({ id: editingItem.id, body }).unwrap();
        message.success('Группа обновлена');
      } else {
        await createGroup(body).unwrap();
        message.success('Группа создана');
      }
      setModalOpen(false);
    } catch {
      message.error('Не удалось сохранить группу');
    }
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id).unwrap();
      message.success('Группа удалена');
    } catch {
      message.error('Не удалось удалить группу');
    }
  };

  const columns: ColumnsType<AssignmentGroupResponse> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v) => v ?? '—',
    },
    {
      title: 'Операторов',
      dataIndex: 'operatorCount',
      key: 'operatorCount',
      width: 110,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="Состав группы">
            <Button size="small" icon={<TeamOutlined />}
              onClick={() => setDetailGroupId(record.id)} />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="Удалить">
            <Popconfirm
              title="Удалить группу назначения?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да" cancelText="Нет"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = (data?.content ?? []).filter((item) => {
    const bySearch = !search.trim()
      || item.name.toLowerCase().includes(search.toLowerCase())
      || (item.description ?? '').toLowerCase().includes(search.toLowerCase());
    const byOperators = minOperators === null || item.operatorCount >= minOperators;
    return bySearch && byOperators;
  });

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>Группы назначения</Title>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              Показано {filteredData.length} из {data?.totalElements ?? 0}
            </span>
          </div>
          <Space>
            <Tooltip title="Обновить"><Button icon={<ReloadOutlined />} onClick={() => refetch()} /></Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Создать группу
            </Button>
          </Space>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space wrap>
          <Input
            placeholder="Поиск по названию или описанию"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 360 }}
          />
          <InputNumber
            min={0}
            value={minOperators as number | null}
            onChange={(value) => setMinOperators(typeof value === 'number' ? value : null)}
            placeholder="Мин. операторов"
            style={{ width: 180 }}
          />
          {(search || minOperators !== null) && (
            <Button onClick={() => { setSearch(''); setMinOperators(null); }}>
              Сбросить
            </Button>
          )}
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={isLoading || isFetching}
        size="middle"
        pagination={{
          current: page + 1,
          pageSize,
          total: data?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          onChange: (p, s) => { setPage(p - 1); setPageSize(s); },
        }}
      />

      <Modal
        title={<Space><TeamOutlined />{editingItem ? 'Редактировать группу' : 'Создать группу назначения'}</Space>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingItem ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={creating || updating}
        width={560}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Название *" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
            <Controller name="name" control={control}
              render={({ field }) => <Input {...field} maxLength={255} placeholder="Название группы" />} />
          </Form.Item>
          <Form.Item label="Описание">
            <Controller name="description" control={control}
              render={({ field }) => <Input.TextArea {...field} rows={2} />} />
          </Form.Item>
          <Form.Item
            label="Операторы *"
            validateStatus={errors.operatorIds ? 'error' : ''}
            help={errors.operatorIds?.message as string}
          >
            <Controller name="operatorIds" control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="Выберите операторов"
                  showSearch
                  optionFilterProp="label"
                  options={operatorOptions}
                  filterOption={(input, opt) =>
                    (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              )} />
          </Form.Item>
        </Form>
      </Modal>

      <GroupDetailModal
        groupId={detailGroupId}
        open={!!detailGroupId}
        onClose={() => setDetailGroupId(null)}
      />
    </div>
  );
}
