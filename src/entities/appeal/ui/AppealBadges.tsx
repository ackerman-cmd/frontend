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
  FileTextOutlined,
  PhoneOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
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
  LETTER: { icon: <FileTextOutlined />, label: 'Письмо', color: 'default' },
  CALL: { icon: <PhoneOutlined />, label: 'Звонок', color: 'green' },
  CHAT: { icon: <MessageOutlined />, label: 'Чат', color: 'purple' },
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
