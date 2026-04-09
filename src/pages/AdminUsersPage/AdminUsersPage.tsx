import React, { useState } from 'react';
import {
  Table, Typography, Tag, Space, Button, Input, Select, Tooltip,
  message, Card, Row, Col, Badge,
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, UserOutlined,
  CheckCircleOutlined, StopOutlined, ClockCircleOutlined, MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAdminListUsersQuery, useAdminChangeUserStatusMutation } from '../../shared/api/adminApi';
import type { UserResponse, UserStatus } from '../../entities/user/model/types';

const { Title } = Typography;
const { Option } = Select;

const STATUS_CONFIG: Record<UserStatus, { color: string; label: string; icon: React.ReactNode }> = {
  ACTIVE:               { color: 'success', label: 'Активен',             icon: <CheckCircleOutlined /> },
  INACTIVE:             { color: 'default', label: 'Неактивен',           icon: <MinusCircleOutlined /> },
  BLOCKED:              { color: 'error',   label: 'Заблокирован',        icon: <StopOutlined /> },
  PENDING_VERIFICATION: { color: 'warning', label: 'Ожидает верификации', icon: <ClockCircleOutlined /> },
};

const ROLE_COLORS: Record<string, string> = {
  ROLE_ADMIN:    'gold',
  ROLE_OPERATOR: 'blue',
  ROLE_USER:     'default',
};

export default function AdminUsersPage() {
  const [page, setPage]         = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isFetching, refetch } = useAdminListUsersQuery({ page, size: pageSize });
  const [changeStatus] = useAdminChangeUserStatusMutation();

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      await changeStatus({ id, status }).unwrap();
      message.success('Статус пользователя обновлён');
    } catch {
      message.error('Не удалось изменить статус');
    }
  };

  const allUsers = data?.content ?? [];
  const filteredUsers = search
    ? allUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.firstName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.lastName ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : allUsers;

  const columns: ColumnsType<UserResponse> = [
    {
      title: 'Пользователь',
      key: 'user',
      ellipsis: true,
      render: (_, r) => {
        const fullName = [r.firstName, r.lastName].filter(Boolean).join(' ');
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{r.username}</span>
            {fullName && <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{fullName}</span>}
          </Space>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      render: (email, r) => (
        <Space size={4}>
          <span>{email}</span>
          {r.emailVerified && (
            <Tooltip title="Email подтверждён">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 13 }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 185,
      render: (status: UserStatus, record) => {
        return (
          <Select
            size="small"
            value={status}
            style={{ width: 175 }}
            onChange={(val: UserStatus) => handleStatusChange(record.id, val)}
          >
            {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((s) => (
              <Option key={s} value={s}>
                <Badge status={STATUS_CONFIG[s].color as any} text={STATUS_CONFIG[s].label} />
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Роли',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles?: string[]) =>
        roles?.length ? (
          <Space size={4} wrap>
            {roles.map((r) => (
              <Tag key={r} color={ROLE_COLORS[r] ?? 'default'} style={{ margin: 0, fontSize: 11 }}>
                {r.replace('ROLE_', '')}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: 'var(--gray-400)' }}>—</span>
        ),
    },
    {
      title: 'Зарегистрирован',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 145,
      render: (v) => dayjs(v).format('DD.MM.YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserOutlined style={{ fontSize: 18, color: 'var(--black)' }} />
        </div>
        <Title level={4} style={{ margin: 0 }}>Пользователи</Title>
        <Tag color="blue" style={{ marginLeft: 4 }}>
          {data?.totalElements ?? 0}
        </Tag>
      </div>

      <Card
        style={{ borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--gray-200)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Row
          gutter={12}
          align="middle"
          style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}
        >
          <Col flex="auto">
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
              placeholder="Поиск по username, email, имени..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={() => { setSearch(searchInput); setPage(0); }}
              allowClear
              onClear={() => { setSearch(''); setSearchInput(''); setPage(0); }}
              style={{ maxWidth: 360 }}
            />
          </Col>
          <Col>
            <Tooltip title="Обновить">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isFetching}
              />
            </Tooltip>
          </Col>
        </Row>

        <Table<UserResponse>
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={isLoading || isFetching}
          pagination={{
            current: page + 1,
            pageSize,
            total: data?.totalElements ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}–${range[1]} из ${total}`,
            onChange: (p, ps) => {
              setPage(p - 1);
              setPageSize(ps);
            },
          }}
          size="middle"
          style={{ borderRadius: 0 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
