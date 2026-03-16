import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from '../../shared/lib/pkce';
import {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPES,
  CODE_VERIFIER_KEY,
  STATE_KEY,
} from '../../shared/lib/constants';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const verifier = generateCodeVerifier();
      sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
      const state = generateCodeVerifier();
      sessionStorage.setItem(STATE_KEY, state);
      const challenge = await generateCodeChallenge(verifier);
      const url = buildAuthorizationUrl({
        authorizationUrl: OAUTH_AUTHORIZE_URL,
        clientId: OAUTH_CLIENT_ID,
        redirectUri: OAUTH_REDIRECT_URI,
        scope: OAUTH_SCOPES,
        codeChallenge: challenge,
        state,
      });
      window.location.href = url;
    } catch {
      setLoading(false);
      setError('Не удалось инициировать вход. Проверьте соединение.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <h1 className={styles.cardTitle}>Добро пожаловать</h1>
          <p className={styles.cardSubtitle}>
            Для входа вы будете перенаправлены на страницу авторизации
          </p>
        </div>
        <div className={styles.strip} />
        <div className={styles.cardBody}>
          {error && (
            <div className={styles.alert}>
              <ExclamationCircleOutlined className={styles.alertIcon} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.btnSubmit}
            disabled={loading}
            onClick={handleLogin}
          >
            {loading
              ? <><LoadingOutlined /> Переход к авторизации...</>
              : <><span>Войти через SSO</span><ArrowRightOutlined /></>
            }
          </button>

          <div className={styles.secNote}>
            <SafetyCertificateOutlined className={styles.secNoteIcon} />
            <span>Защищённый вход · OAuth 2.0 + PKCE · Данные зашифрованы</span>
          </div>

          <div className={styles.footer}>
            Нет учётной записи?{' '}
            <Link to="/register">Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
