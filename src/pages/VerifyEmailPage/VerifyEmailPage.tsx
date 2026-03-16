import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingOutlined, CheckOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useVerifyEmailQuery } from '../../shared/api/authApi';
import type { ProblemDetail } from '../../entities/user/model/types';
import styles from './VerifyEmailPage.module.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { data, isLoading, isSuccess, isError, error } = useVerifyEmailQuery(
    token ?? '', { skip: !token }
  );

  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => navigate('/login', { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [isSuccess, navigate]);

  if (!token) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={`${styles.icon} ${styles.iconWarn}`}><WarningOutlined style={{ color: '#d4b106' }} /></div>
          <h2 className={styles.title}>Некорректная ссылка</h2>
          <p className={styles.desc}>Токен подтверждения отсутствует. Перейдите по ссылке из письма.</p>
          <button className={styles.btn} onClick={() => navigate('/login')}>На страницу входа</button>
        </div>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={`${styles.icon} ${styles.iconLoading}`}>
            <LoadingOutlined style={{ color: 'var(--black)', fontSize: 28 }} />
          </div>
          <h2 className={styles.title}>Подтверждение email...</h2>
          <p className={styles.desc}>Пожалуйста, подождите</p>
        </div>
      </div>
    </div>
  );

  if (isError) {
    const detail = (error as { data?: ProblemDetail })?.data?.detail;
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.strip} />
          <div className={styles.body}>
            <div className={`${styles.icon} ${styles.iconError}`}><CloseCircleOutlined style={{ color: 'var(--red)', fontSize: 32 }} /></div>
            <h2 className={styles.title}>Ошибка подтверждения</h2>
            <p className={styles.desc}>{detail ?? 'Токен истёк или уже использован.'}</p>
            <button className={styles.btn} onClick={() => navigate('/login')}>На страницу входа</button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess && data) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={`${styles.icon} ${styles.iconSuccess}`}><CheckOutlined style={{ color: 'var(--black)', fontSize: 32 }} /></div>
          <h2 className={styles.title}>Почта подтверждена!</h2>
          <p className={styles.desc}>
            Аккаунт активирован. Вы будете перенаправлены на страницу входа через несколько секунд.
          </p>
          <button className={styles.btn} onClick={() => navigate('/login', { replace: true })}>
            Перейти ко входу
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
