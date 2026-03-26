import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Row, Col,
  message, Popconfirm, Tooltip, Card, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, BankOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useGetOrganizationsQuery,
  useSearchOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '../../shared/api/organizationsApi';
import type { OrganizationResponse, OrganizationRequest } from '../../entities/organization/model/types';
import { useAuth } from '../../shared/hooks/useAuth';

const { Title } = Typography;

const orgSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(512),
  inn: z.string().regex(/^\d{10}(\d{2})?$/, 'ИНН должен содержать 10 или 12 цифр'),
  kpp: z.string().regex(/^\d{9}$/, 'КПП должен содержать 9 цифр').optional().or(z.literal('')),
  ogrn: z.string().regex(/^\d{13}(\d{2})?$/, 'ОГРН должен содержать 13 или 15 цифр').optional().or(z.literal('')),
  legalAddress: z.string().optional(),
  contactEmail: z.string().email('Некорректный email').optional().or(z.literal('')),
  contactPhone: z.string().max(32).optional(),
  description: z.string().optional(),
});
type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrganizationsPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchName, setSearchName] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganizationResponse | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchName), 400);
    return () => clearTimeout(t);
  }, [searchName]);

  const isSearching = debouncedSearch.trim().length > 0;

  const { data: listData, isLoading: listLoading, isFetching: listFetching, refetch } =
    useGetOrganizationsQuery(
      { page, size: pageSize },
      { skip: isSearching },
    );

  const { data: searchData, isLoading: searchLoading, isFetching: searchFetching } =
    useSearchOrganizationsQuery(
      { name: debouncedSearch, page, size: pageSize },
      { skip: !isSearching },
    );

  const currentData = isSearching ? searchData : listData;
  const isLoading = isSearching ? searchLoading : listLoading;
  const isFetching = isSearching ? searchFetching : listFetching;

  const [createOrg, { isLoading: creating }] = useCreateOrganizationMutation();
  const [updateOrg, { isLoading: updating }] = useUpdateOrganizationMutation();
  const [deleteOrg] = useDeleteOrganizationMutation();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', inn: '', kpp: '', ogrn: '', legalAddress: '', contactEmail: '', contactPhone: '', description: '' },
  });

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: '', inn: '', kpp: '', ogrn: '', legalAddress: '', contactEmail: '', contactPhone: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (item: OrganizationResponse) => {
    setEditingItem(item);
    reset({
      name: item.name,
      inn: item.inn,
      kpp: item.kpp ?? '',
      ogrn: item.ogrn ?? '',
      legalAddress: item.legalAddress ?? '',
      contactEmail: item.contactEmail ?? '',
      contactPhone: item.contactPhone ?? '',
      description: item.description ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = handleSubmit(async (values) => {
    const body: OrganizationRequest = {
      name: values.name,
      inn: values.inn,
      kpp: values.kpp || undefined,
      ogrn: values.ogrn || undefined,
      legalAddress: values.legalAddress || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      description: values.description || undefined,
    };
    try {
      if (editingItem) {
        await updateOrg({ id: editingItem.id, body }).unwrap();
        message.success('Организация обновлена');
      } else {
        await createOrg(body).unwrap();
        message.success('Организация создана');
      }
      setModalOpen(false);
    } catch {
      message.error('Не удалось сохранить организацию');
    }
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteOrg(id).unwrap();
      message.success('Организация удалена');
    } catch {
      message.error('Не удалось удалить организацию');
    }
  };

  const columns: ColumnsType<OrganizationResponse> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'ИНН',
      dataIndex: 'inn',
      key: 'inn',
      width: 130,
    },
    {
      title: 'КПП',
      dataIndex: 'kpp',
      key: 'kpp',
      width: 100,
      render: (v) => v ?? '—',
    },
    {
      title: 'ОГРН',
      dataIndex: 'ogrn',
      key: 'ogrn',
      width: 150,
      render: (v) => v ?? '—',
    },
    {
      title: 'Email',
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      width: 190,
      ellipsis: true,
      render: (v) => v ?? '—',
    },
    {
      title: 'Телефон',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 140,
      render: (v) => v ?? '—',
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
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Редактировать">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Удалить">
              <Popconfirm
                title="Удалить организацию?"
                description="Это действие необратимо."
                onConfirm={() => handleDelete(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: '16px 18px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>Организации</Title>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              Показано {currentData?.content?.length ?? 0} из {currentData?.totalElements ?? 0}
            </span>
          </div>
          <Space>
            <Tooltip title="Обновить"><Button icon={<ReloadOutlined />} onClick={() => refetch()} /></Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить организацию
            </Button>
          </Space>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Поиск по названию"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => { setSearchName(e.target.value); setPage(0); }}
            allowClear
            style={{ maxWidth: 420 }}
          />
          <Tag color={isSearching ? 'blue' : 'default'} style={{ borderRadius: 999 }}>
            {isSearching ? 'Режим поиска' : 'Все организации'}
          </Tag>
        </div>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={currentData?.content ?? []}
        loading={isLoading || isFetching}
        scroll={{ x: 900 }}
        size="middle"
        pagination={{
          current: page + 1,
          pageSize,
          total: currentData?.totalElements ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          onChange: (p, s) => { setPage(p - 1); setPageSize(s); },
        }}
      />

      <Modal
        title={<Space><BankOutlined />{editingItem ? 'Редактировать организацию' : 'Добавить организацию'}</Space>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingItem ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        confirmLoading={creating || updating}
        width={680}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Название *" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
                <Controller name="name" control={control}
                  render={({ field }) => <Input {...field} maxLength={512} placeholder="Полное наименование организации" />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ИНН *" validateStatus={errors.inn ? 'error' : ''} help={errors.inn?.message}>
                <Controller name="inn" control={control}
                  render={({ field }) => <Input {...field} placeholder="10 или 12 цифр" maxLength={12} />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="КПП" validateStatus={errors.kpp ? 'error' : ''} help={errors.kpp?.message}>
                <Controller name="kpp" control={control}
                  render={({ field }) => <Input {...field} placeholder="9 цифр" maxLength={9} />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ОГРН" validateStatus={errors.ogrn ? 'error' : ''} help={errors.ogrn?.message}>
                <Controller name="ogrn" control={control}
                  render={({ field }) => <Input {...field} placeholder="13 или 15 цифр" maxLength={15} />} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Юридический адрес">
                <Controller name="legalAddress" control={control}
                  render={({ field }) => <Input {...field} placeholder="Адрес регистрации" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Контактный email" validateStatus={errors.contactEmail ? 'error' : ''} help={errors.contactEmail?.message}>
                <Controller name="contactEmail" control={control}
                  render={({ field }) => <Input {...field} placeholder="org@example.com" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Контактный телефон">
                <Controller name="contactPhone" control={control}
                  render={({ field }) => <Input {...field} placeholder="+7..." maxLength={32} />} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Описание">
                <Controller name="description" control={control}
                  render={({ field }) => <Input.TextArea {...field} rows={2} />} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
