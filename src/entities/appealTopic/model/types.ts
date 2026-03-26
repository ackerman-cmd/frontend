export type AppealTopicCategory =
  | 'ACCOUNT_AND_CARD'
  | 'DIGITAL_BANKING'
  | 'PAYMENTS_AND_TRANSFERS'
  | 'LOANS_AND_CREDITS'
  | 'SECURITY'
  | 'TECHNICAL_ISSUES'
  | 'GENERAL';

export const TOPIC_CATEGORY_LABELS: Record<AppealTopicCategory, string> = {
  ACCOUNT_AND_CARD: 'Счета и карты',
  DIGITAL_BANKING: 'Цифровой банкинг',
  PAYMENTS_AND_TRANSFERS: 'Платежи и переводы',
  LOANS_AND_CREDITS: 'Кредиты и займы',
  SECURITY: 'Безопасность',
  TECHNICAL_ISSUES: 'Технические проблемы',
  GENERAL: 'Общие вопросы',
};

export const TOPIC_CATEGORY_ICONS: Record<AppealTopicCategory, string> = {
  ACCOUNT_AND_CARD: '💳',
  DIGITAL_BANKING: '🏦',
  PAYMENTS_AND_TRANSFERS: '💸',
  LOANS_AND_CREDITS: '📋',
  SECURITY: '🔒',
  TECHNICAL_ISSUES: '⚙️',
  GENERAL: '❓',
};

export interface AppealTopic {
  id: string;
  name: string;
  category: AppealTopicCategory;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppealTopicRequest {
  name: string;
  category: AppealTopicCategory;
  description?: string;
}

export type GroupedTopics = Partial<Record<AppealTopicCategory, AppealTopic[]>>;
