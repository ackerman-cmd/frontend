import React from 'react';
import { ToolOutlined } from '@ant-design/icons';
import styles from './MainPage.module.css';

export default function MainPage() {
  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className={styles.iconWrap}>
            <ToolOutlined className={styles.icon} />
          </div>
          <h1 className={styles.title}>Главная страница</h1>
          <div className={styles.brand}>arm-support-service</div>
          <p className={styles.subtitle}>🚧 Страница в разработке</p>
        </div>
      </div>
    </div>
  );
}
