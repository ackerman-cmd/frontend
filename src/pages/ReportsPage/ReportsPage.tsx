import React, { useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Tooltip,
  message,
} from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useGetReportsQuery,
  useGenerateReportMutation,
  type ReportHistoryDto,
} from '../../shared/api/reportsApi';

const { Title, Text } = Typography;

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    SENT:    { color: 'success', label: 'Отправлен' },
    PENDING: { color: 'processing', label: 'В обработке' },
    FAILED:  { color: 'error', label: 'Ошибка' },
  };
  const info = map[status] ?? { color: 'default', label: status };
  return <Tag color={info.color}>{info.label}</Tag>;
}

export default function ReportsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isFetching, refetch } = useGetReportsQuery({ page, size: pageSize });
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();

  const handleGenerate = async () => {
    try {
      await generateReport().unwrap();
      message.success('Отчёт поставлен в очередь на генерацию');
      setTimeout(() => refetch(), 2000);
    } catch {
      message.error('Не удалось запустить генерацию отчёта');
    }
  };

  const columns: ColumnsType<ReportHistoryDto> = [
    {
      title: 'Период',
      key: 'period',
      render: (_, r) =>
        r.periodStart && r.periodEnd
          ? `${r.periodStart} — ${r.periodEnd}`
          : '—',
    },
    {
      title: 'Сформирован',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
    },
    {
      title: 'Отправлен',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Обращений',
      dataIndex: 'totalAppeals',
      key: 'totalAppeals',
      align: 'right',
      render: (v?: number) => v ?? '—',
    },
    {
      title: 'Нарушений SLA',
      dataIndex: 'slaBreachesCount',
      key: 'slaBreachesCount',
      align: 'right',
      render: (v?: number) => {
        if (v == null) return '—';
        return v > 0
          ? <Text type="danger">{v}</Text>
          : <Text type="success">0</Text>;
      },
    },
    {
      title: 'Размер',
      dataIndex: 'fileSizeBytes',
      key: 'fileSizeBytes',
      align: 'right',
      render: (v?: number) => formatBytes(v),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, r) =>
        r.s3Url ? (
          <Tooltip title="Скачать PDF">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              href={r.s3Url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>нет файла</Text>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <Space align="center" size={12}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#fff3cd', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <FilePdfOutlined style={{ fontSize: 18, color: '#b7791f' }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>Отчёты</Title>
        </Space>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Обновить
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleGenerate}
            loading={isGenerating}
            style={{ background: '#FFDD2D', color: '#1A1A1A', borderColor: '#FFDD2D' }}
          >
            Сформировать сейчас
          </Button>
        </Space>
      </div>

      <Table<ReportHistoryDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        pagination={{
          current: page + 1,
          pageSize,
          total: data?.totalElements ?? 0,
          onChange: (p) => setPage(p - 1),
          showSizeChanger: false,
        }}
        locale={{ emptyText: 'Отчётов пока нет' }}
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #EBEBEB',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
