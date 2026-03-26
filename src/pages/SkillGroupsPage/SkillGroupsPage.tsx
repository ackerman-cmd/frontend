import React, { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select,
  message, Popconfirm, Tooltip, Tag, Descriptions, Divider, Card,
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
  useGetSkillGroupsQuery,
  useCreateSkillGroupMutation,
  useGetSkillGroupByIdQuery,
  useUpdateSkillGroupMutation,
  useDeleteSkillGroupMutation,
  useRemoveOperatorFromSkillGroupMutation,
} from '../../shared/api/skillGroupsApi';
import { useListOperatorsQuery } from '../../shared/api/adminApi';
import type { SkillGroupResponse } from '../../entities/skillGroup/model/types';

const { Title } = Typography;

const skillGroupSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  description: z.string().optional(),
  skills: z.array(z.string().min(1)).min(1, 'Укажите хотя бы один навык'),
  operatorIds: z.array(z.string()).min(1, 'Выберите хотя бы одного оператора'),
});
type SkillGroupFormValues = z.infer<typeof skillGroupSchema>;

function SkillGroupDetailModal({
  groupId,
  open,
  onClose,
}: {
  groupId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: group, isLoading } = useGetSkillGroupByIdQuery(groupId!, { skip: !groupId });
  const [removeOperator] = useRemoveOperatorFromSkillGroupMutation();

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
      title={<Space><TeamOutlined />{group ? `Скилл-группа: ${group.name}` : 'Скилл-группа'}</Space>}
      open={open}
      onCancel={onClose}
      footer={<Button style={{ borderRadius: 10 }} onClick={onClose}>Закрыть</Button>}
      width={540}
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
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Навыки</div>
          <Space wrap style={{ marginBottom: 12 }}>
            {group.skills.length === 0
              ? <span style={{ color: '#aaa' }}>Нет навыков</span>
              : group.skills.map((s) => <Tag key={s} color="purple">{s}</Tag>)
            }
          </Space>
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
                  <span>
                    {op.fullName}
                    <span style={{ color: '#aaa', fontSize: 12 }}> ({op.username})</span>
                  </span>
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

export default function SkillGroupsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SkillGroupResponse | null>(null);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, refetch } = useGetSkillGroupsQuery({ page, size: pageSize });
  const { data: operatorsPage } = useListOperatorsQuery();

  const [createGroup, { isLoading: creating }] = useCreateSkillGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateSkillGroupMutation();
  const [deleteGroup] = useDeleteSkillGroupMutation();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SkillGroupFormValues>({
    resolver: zodResolver(skillGroupSchema),
    defaultValues: { name: '', description: '', skills: [], operatorIds: [] },
  });

  const operatorOptions = (operatorsPage?.content ?? []).map((u) => ({
    value: u.id,
    label: `${u.firstName ?? ''} ${u.lastName ?? ''} (${u.username})`.trim(),
  }));

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: '', description: '', skills: [], operatorIds: [] });
    setModalOpen(true);
  };

  const openEdit = (item: SkillGroupResponse) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description ?? '',
      skills: [...item.skills],
      operatorIds: item.operators.map((o) => o.id),
    });
    setModalOpen(true);
  };

  const handleSave = handleSubmit(async (values) => {
    const body = {
      name: values.name,
      description: values.description || undefined,
      skills: values.skills,
      operatorIds: values.operatorIds,
    };
    try {
      if (editingItem) {
        await updateGroup({ id: editingItem.id, body }).unwrap();
        message.success('Скилл-группа обновлена');
      } else {
        await createGroup(body).unwrap();
        message.success('Скилл-группа создана');
      }
      setModalOpen(false);
    } catch {
      message.error('Не удалось сохранить скилл-группу');
    }
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id).unwrap();
      message.success('Скилл-группа удалена');
    } catch {
      message.error('Не удалось удалить скилл-группу');
    }
  };

  const columns: ColumnsType<SkillGroupResponse> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Навыки',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <Space wrap size={4}>
          {skills.slice(0, 4).map((s) => <Tag key={s} color="purple" style={{ fontSize: 11 }}>{s}</Tag>)}
          {skills.length > 4 && <Tag>+{skills.length - 4}</Tag>}
        </Space>
      ),
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
              title="Удалить скилл-группу?"
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

  const filteredData = (data?.content ?? []).filter((item) =>
    !search.trim()
    || item.name.toLowerCase().includes(search.toLowerCase())
    || item.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>Скилл-группы</Title>
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
        <Input
          placeholder="Поиск по названию или навыкам"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 400 }}
        />
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={isLoading || isFetching}
        scroll={{ x: 800 }}
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
        title={<Space><TeamOutlined />{editingItem ? 'Редактировать скилл-группу' : 'Создать скилл-группу'}</Space>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingItem ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={creating || updating}
        width={580}
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
            label="Навыки *"
            validateStatus={errors.skills ? 'error' : ''}
            help={errors.skills?.message as string}
          >
            <Controller name="skills" control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Введите навык и нажмите Enter"
                  tokenSeparators={[',']}
                />
              )} />
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

      <SkillGroupDetailModal
        groupId={detailGroupId}
        open={!!detailGroupId}
        onClose={() => setDetailGroupId(null)}
      />
    </div>
  );
}
