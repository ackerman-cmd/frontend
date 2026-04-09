import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MailOutlined,
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useRegisterMutation } from '../../shared/api/authApi';
import type { ProblemDetail, RegisterRequest } from '../../entities/user/model/types';
import styles from './RegisterPage.module.css';

const schema = z.object({
  email:     z.string().min(1, 'Email обязателен').email('Некорректный email'),
  username:  z.string().min(3, 'Минимум 3 символа').max(64).regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры, _'),
  password:  z.string().min(8, 'Минимум 8 символов').max(128),
  firstName: z.string().max(64).optional(),
  lastName:  z.string().max(64).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [success, setSuccess] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '', firstName: '', lastName: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerErr(null);
    const payload: RegisterRequest = {
      email: values.email,
      username: values.username,
      password: values.password,
      ...(values.firstName?.trim() && { firstName: values.firstName.trim() }),
      ...(values.lastName?.trim() && { lastName: values.lastName.trim() }),
    };
    try {
      await register(payload).unwrap();
      setSuccess(true);
    } catch (err) {
      const e = err as { status?: number | string; data?: ProblemDetail; error?: string };
      if (e.status === 'FETCH_ERROR') {
        setServerErr('Сервер недоступен. Проверьте, что бэкенд запущен.');
      } else if (e.status === 409) {
        setServerErr(e.data?.detail ?? 'Email или имя пользователя уже заняты.');
      } else if (e.status === 400) {
        setServerErr(e.data?.detail ?? 'Проверьте правильность данных.');
      } else {
        setServerErr(`Ошибка сервера (${e.status ?? '?'}). Попробуйте позже.`);
      }
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.strip} />
          <div className={styles.successBody}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Аккаунт создан!</h2>
            <p className={styles.successDesc}>
              Письмо с подтверждением отправлено на вашу почту.<br />
              Перейдите по ссылке для активации аккаунта.<br />
              <strong>Ссылка действительна 24 часа.</strong>
            </p>
            <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
              Перейти ко входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <Link to="/login" className={styles.backLink}>
            <ArrowLeftOutlined /> Назад ко входу
          </Link>
          <h1 className={styles.cardTitle}>Создать аккаунт</h1>
          <p className={styles.cardSubtitle}>Заполните форму для регистрации</p>
        </div>
        <div className={styles.strip} />
        <div className={styles.cardBody}>
          {serverErr && (
            <div className={styles.alert}>
              <ExclamationCircleOutlined className={styles.alertIcon} />
              <span>{serverErr}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.fields}>
              <Controller name="email" control={control} render={({ field }) => (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="r-email">Email</label>
                  <div className={styles.inputRow}>
                    <span className={styles.inputIcon}><MailOutlined /></span>
                    <input id="r-email" type="email" autoComplete="email"
                      className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                      placeholder="user@example.com" {...field} />
                  </div>
                  {errors.email && <p className={styles.errMsg}>{errors.email.message}</p>}
                </div>
              )} />

              <Controller name="username" control={control} render={({ field }) => (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="r-uname">Имя пользователя</label>
                  <div className={styles.inputRow}>
                    <span className={styles.inputIcon}><UserOutlined /></span>
                    <input id="r-uname" type="text" autoComplete="username"
                      className={`${styles.input} ${errors.username ? styles.inputErr : ''}`}
                      placeholder="john_doe" {...field} />
                  </div>
                  {errors.username
                    ? <p className={styles.errMsg}>{errors.username.message}</p>
                    : <p className={styles.hint}>3–64 символа, только латиница, цифры и _</p>
                  }
                </div>
              )} />

              <div className={styles.nameRow}>
                <Controller name="firstName" control={control} render={({ field }) => (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="r-fn">
                      Имя <span className={styles.labelOpt}>необязательно</span>
                    </label>
                    <div className={styles.inputRow}>
                      <input id="r-fn" type="text" autoComplete="given-name"
                        className={`${styles.input} ${styles.inputNoIcon} ${errors.firstName ? styles.inputErr : ''}`}
                        placeholder="Иван" {...field} />
                    </div>
                    {errors.firstName && <p className={styles.errMsg}>{errors.firstName.message}</p>}
                  </div>
                )} />
                <Controller name="lastName" control={control} render={({ field }) => (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="r-ln">
                      Фамилия <span className={styles.labelOpt}>необязательно</span>
                    </label>
                    <div className={styles.inputRow}>
                      <input id="r-ln" type="text" autoComplete="family-name"
                        className={`${styles.input} ${styles.inputNoIcon} ${errors.lastName ? styles.inputErr : ''}`}
                        placeholder="Иванов" {...field} />
                    </div>
                    {errors.lastName && <p className={styles.errMsg}>{errors.lastName.message}</p>}
                  </div>
                )} />
              </div>

              <Controller name="password" control={control} render={({ field }) => (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="r-pwd">Пароль</label>
                  <div className={styles.inputRow}>
                    <span className={styles.inputIcon}><LockOutlined /></span>
                    <input id="r-pwd" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                      className={`${styles.input} ${errors.password ? styles.inputErr : ''}`}
                      placeholder="Минимум 8 символов" {...field} />
                    <button type="button" className={styles.eyeBtn}
                      onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                      aria-label={showPwd ? 'Скрыть' : 'Показать'}>
                      {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                  {errors.password
                    ? <p className={styles.errMsg}>{errors.password.message}</p>
                    : <p className={styles.hint}>8–128 символов</p>
                  }
                </div>
              )} />
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
              {isLoading
                ? <><LoadingOutlined /> Создание аккаунта...</>
                : <><CheckOutlined /> Создать аккаунт</>
              }
            </button>
          </form>

          <div className={styles.loginLink}>
            Уже есть аккаунт?{' '}
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
