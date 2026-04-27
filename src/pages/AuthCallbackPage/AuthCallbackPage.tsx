import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../app/store/hooks';
import { setCredentials } from '../../features/auth/model/authSlice';
import { useExchangeCodeForTokenMutation } from '../../shared/api/authApi';
import { CODE_VERIFIER_KEY, STATE_KEY } from '../../shared/lib/constants';
import type { ProblemDetail } from '../../entities/user/model/types';
import styles from './AuthCallbackPage.module.css';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [exchangeCode, { isError, error }] = useExchangeCodeForTokenMutation();
  const hasExchanged = useRef(false);

  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (errorParam || !code || hasExchanged.current) return;
    hasExchanged.current = true;
    const storedState = sessionStorage.getItem(STATE_KEY);
    if (storedState && returnedState && storedState !== returnedState) {
      sessionStorage.removeItem(CODE_VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
      return;
    }
    (async () => {
      try {
        const res = await exchangeCode({ code, state: returnedState ?? undefined }).unwrap();
        dispatch(setCredentials(res.access_token));
        sessionStorage.removeItem(CODE_VERIFIER_KEY);
        sessionStorage.removeItem(STATE_KEY);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('[AuthCallback]', err);
      }
    })();
  }, [code, returnedState, errorParam, exchangeCode, dispatch, navigate]);

  if (errorParam) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={styles.loadingIcon} style={{ background: '#fff1f0', animation: 'none' }}>
            <CloseCircleOutlined style={{ color: 'var(--red)' }} />
          </div>
          <h2 className={styles.loadingTitle}>Авторизация отклонена</h2>
          <p className={styles.loadingDesc}>
            {errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : `Ошибка: ${errorParam}`}
          </p>
          <button className={styles.btn} onClick={() => navigate('/signin')}>Вернуться ко входу</button>
        </div>
      </div>
    </div>
  );

  if (!code) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={styles.loadingIcon} style={{ background: '#fffbe6', animation: 'none' }}>
            <WarningOutlined style={{ color: '#d4b106' }} />
          </div>
          <h2 className={styles.loadingTitle}>Некорректная ссылка</h2>
          <p className={styles.loadingDesc}>Параметр code отсутствует. Попробуйте войти снова.</p>
          <button className={styles.btn} onClick={() => navigate('/signin')}>На страницу входа</button>
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
            <div className={styles.loadingIcon} style={{ background: '#fff1f0', animation: 'none' }}>
              <CloseCircleOutlined style={{ color: 'var(--red)' }} />
            </div>
            <h2 className={styles.loadingTitle}>Ошибка входа</h2>
            <p className={styles.loadingDesc}>{detail ?? 'Authorization code истёк или уже использован.'}</p>
            <button className={styles.btn} onClick={() => navigate('/signin')}>Попробовать снова</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.strip} />
        <div className={styles.body}>
          <div className={styles.loadingIcon}>
            <LoadingOutlined style={{ color: 'var(--black)', fontSize: 28 }} />
          </div>
          <h2 className={styles.loadingTitle}>Выполняется вход...</h2>
          <p className={styles.loadingDesc}>Пожалуйста, подождите. Обмен кода авторизации.</p>
        </div>
      </div>
    </div>
  );
}
