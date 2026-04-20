import React from 'react';
import { Tag } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  HourglassOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  ArrowUpOutlined,
  FireOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

function VkIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style={{ verticalAlign: '-0.125em', ...style }}>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-.853-1.49.302v1.714c0 .344-.114.546-1.046.546-1.538 0-3.244-.93-4.44-2.66-1.803-2.537-2.296-4.438-2.296-4.838 0-.275.103-.526.606-.526H8.66c.45 0 .622.21.796.7.875 2.507 2.34 4.705 2.944 4.705.228 0 .33-.104.33-.674V11.58c-.066-1.21-.708-1.313-.708-1.743 0-.21.17-.42.444-.42h2.745c.377 0 .513.197.513.64v3.44c0 .378.166.51.28.51.228 0 .42-.132.838-.552 1.296-1.453 2.22-3.7 2.22-3.7.124-.275.332-.526.784-.526h1.743c.523 0 .638.27.523.64-.218.998-2.34 4.007-2.34 4.007-.183.305-.25.44 0 .78.183.247.782.758 1.182 1.218.735.84 1.297 1.55 1.45 2.035.152.48-.096.724-.577.724z" />
    </svg>
  );
}
import type { AppealStatus, AppealPriority, AppealChannel, AppealDirection } from '../model/types';

// ─── Status ─────────────────────────────────────────────────────────────────

interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<AppealStatus, StatusConfig> = {
  PENDING_PROCESSING: {
    color: '#1677ff',
    bg: '#e6f4ff',
    border: '#91caff',
    icon: <ClockCircleOutlined />,
    label: 'Ожидает обработки',
  },
  IN_PROGRESS: {
    color: '#d48806',
    bg: '#fffbe6',
    border: '#ffe58f',
    icon: <SyncOutlined spin />,
    label: 'В работе',
  },
  WAITING_CLIENT_RESPONSE: {
    color: '#d46b08',
    bg: '#fff7e6',
    border: '#ffd591',
    icon: <HourglassOutlined />,
    label: 'Ожидает ответа',
  },
  CLOSED: {
    color: '#389e0d',
    bg: '#f6ffed',
    border: '#b7eb8f',
    icon: <CheckCircleOutlined />,
    label: 'Закрыто',
  },
  SPAM: {
    color: '#cf1322',
    bg: '#fff2f0',
    border: '#ffa39e',
    icon: <StopOutlined />,
    label: 'Спам',
  },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
) as Record<AppealStatus, string>;

export function AppealStatusBadge({ status, size = 'default' }: { status: string; size?: 'small' | 'default' }) {
  const cfg = STATUS_CONFIG[status as AppealStatus] ?? {
    color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9',
    icon: null, label: status,
  };
  const isSmall = size === 'small';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isSmall ? 4 : 6,
      background: cfg.bg, color: cfg.color,
      padding: isSmall ? '2px 8px' : '4px 12px',
      borderRadius: 20,
      border: `1.5px solid ${cfg.border}`,
      fontWeight: 600,
      fontSize: isSmall ? 12 : 13,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Priority ────────────────────────────────────────────────────────────────

interface PriorityConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

const PRIORITY_CONFIG: Record<AppealPriority, PriorityConfig> = {
  LOW: {
    color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9',
    icon: <ArrowDownOutlined />, label: 'Низкий',
  },
  MEDIUM: {
    color: '#1677ff', bg: '#e6f4ff', border: '#91caff',
    icon: <MinusOutlined />, label: 'Средний',
  },
  HIGH: {
    color: '#d46b08', bg: '#fff7e6', border: '#ffd591',
    icon: <ArrowUpOutlined />, label: 'Высокий',
  },
  CRITICAL: {
    color: '#cf1322', bg: '#fff2f0', border: '#ffa39e',
    icon: <FireOutlined />, label: 'Критический',
  },
};

export const PRIORITY_LABELS = Object.fromEntries(
  Object.entries(PRIORITY_CONFIG).map(([k, v]) => [k, v.label])
) as Record<AppealPriority, string>;

export function AppealPriorityBadge({ priority, size = 'default' }: { priority: string; size?: 'small' | 'default' }) {
  const cfg = PRIORITY_CONFIG[priority as AppealPriority] ?? {
    color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9',
    icon: null, label: priority,
  };
  const isSmall = size === 'small';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isSmall ? 4 : 6,
      background: cfg.bg, color: cfg.color,
      padding: isSmall ? '2px 8px' : '4px 12px',
      borderRadius: 20,
      border: `1.5px solid ${cfg.border}`,
      fontWeight: 600,
      fontSize: isSmall ? 12 : 13,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Channel ─────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<AppealChannel, { icon: React.ReactNode; label: string; color: string }> = {
  EMAIL: { icon: <MailOutlined />, label: 'Email', color: 'blue' },
  CHAT: { icon: <VkIcon />, label: 'ВКонтакте', color: 'purple' },
};

export const CHANNEL_LABELS = Object.fromEntries(
  Object.entries(CHANNEL_CONFIG).map(([k, v]) => [k, v.label])
) as Record<AppealChannel, string>;

export function AppealChannelTag({ channel }: { channel: string }) {
  const cfg = CHANNEL_CONFIG[channel as AppealChannel] ?? { icon: null, label: channel, color: 'default' };
  return (
    <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 12 }}>
      {cfg.label}
    </Tag>
  );
}

// ─── Direction ───────────────────────────────────────────────────────────────

const DIRECTION_CONFIG: Record<AppealDirection, { icon: React.ReactNode; label: string; color: string }> = {
  INBOUND: { icon: <ArrowLeftOutlined />, label: 'Входящее', color: 'cyan' },
  OUTBOUND: { icon: <ArrowRightOutlined />, label: 'Исходящее', color: 'volcano' },
};

export const DIRECTION_LABELS = Object.fromEntries(
  Object.entries(DIRECTION_CONFIG).map(([k, v]) => [k, v.label])
) as Record<AppealDirection, string>;

export function AppealDirectionTag({ direction }: { direction: string }) {
  const cfg = DIRECTION_CONFIG[direction as AppealDirection] ?? { icon: null, label: direction, color: 'default' };
  return (
    <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 12 }}>
      {cfg.label}
    </Tag>
  );
}
