import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Spin, message } from 'antd';
import { LockOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../app/store/hooks';
import { logout } from '../../features/auth/model/authSlice';
import {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../../shared/api/usersApi';
import type { UserStatus, ProblemDetail } from '../../entities/user/model/types';
import styles from './ProfilePage.module.css';

const profileSchema = z.object({
  firstName: z.string().max(64).optional(),
  lastName:  z.string().max(64).optional(),
});
const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Минимум 8 символов').max(128),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'Новый пароль должен отличаться', path: ['newPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PwdForm    = z.infer<typeof pwdSchema>;

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Активен', INACTIVE: 'Неактивен',
  BLOCKED: 'Заблокирован', PENDING_VERIFICATION: 'Ожидает подтверждения',
};
const STATUS_CLASS: Record<UserStatus, string> = {
  ACTIVE: styles.statusActive, INACTIVE: styles.statusInactive,
  BLOCKED: styles.statusBlocked, PENDING_VERIFICATION: styles.statusPending,
};
const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPwd }] = useChangePasswordMutation();
  const [pwdModal, setPwdModal] = useState(false);

  const { control: pc, handleSubmit: hps, reset: rp, formState: { isDirty: pd } } =
    useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { firstName: '', lastName: '' } });

  const { control: wc, handleSubmit: hpw, reset: rw, formState: { errors: we } } =
    useForm<PwdForm>({ resolver: zodResolver(pwdSchema), defaultValues: { currentPassword: '', newPassword: '' } });

  React.useEffect(() => {
    if (user) rp({ firstName: user.firstName ?? '', lastName: user.lastName ?? '' });
  }, [user, rp]);

  const onProfile = async (v: ProfileForm) => {
    try {
      await updateProfile({ firstName: v.firstName || null, lastName: v.lastName || null }).unwrap();
      message.success('Профиль обновлён');
    } catch (err) {
      message.error((err as { data?: ProblemDetail }).data?.detail ?? 'Ошибка обновления');
    }
  };

  const onPwd = async (v: PwdForm) => {
    try {
      await changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }).unwrap();
      message.success('Пароль изменён');
      setPwdModal(false); rw();
    } catch (err) {
      message.error((err as { data?: ProblemDetail }).data?.detail ?? 'Ошибка смены пароля');
    }
  };

  if (isLoading) return <div className={styles.loadingWrap}><Spin size="large" /></div>;

  if (isError || !user) return (
    <div className={styles.errorWrap}>
      <p>Не удалось загрузить профиль</p>
      <button className={styles.btnSecondary} onClick={() => { dispatch(logout()); navigate('/signin', { replace: true }); }}>
        Выйти
      </button>
    </div>
  );

  const initials = ((user.firstName?.charAt(0) ?? '') + (user.lastName?.charAt(0) ?? '')) || user.username.slice(0, 2).toUpperCase();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Мой профиль</h1>

      <div className={styles.avatarCard}>
        <div className={styles.avatarCircle}>{initials.toUpperCase()}</div>
        <div className={styles.avatarInfo}>
          <p className={styles.avatarName}>{fullName}</p>
          <p className={styles.avatarUsername}>@{user.username}</p>
          <span className={`${styles.statusBadge} ${STATUS_CLASS[user.status]}`}>
            <span className={styles.statusDot} />
            {STATUS_LABEL[user.status]}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Данные аккаунта</h2></div>
        <div className={styles.cardBody}>
          <ul className={styles.infoList}>
            {[
              { k: 'Email', v: user.email },
              { k: 'Имя пользователя', v: `@${user.username}` },
              { k: 'Имя', v: user.firstName || '—' },
              { k: 'Фамилия', v: user.lastName || '—' },
              { k: 'Email подтверждён', v: user.emailVerified ? '✓ Да' : '✗ Нет' },
              { k: 'Дата регистрации', v: fmt(user.createdAt) },
            ].map(({ k, v }) => (
              <li key={k} className={styles.infoRow}>
                <span className={styles.infoKey}>{k}</span>
                <span className={styles.infoVal}>{v}</span>
              </li>
            ))}
            {user.roles && user.roles.length > 0 && (
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Роли</span>
                <span className={styles.infoVal}>
                  {user.roles.map(r => <span key={r} className={styles.roleChip}>{r}</span>)}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Редактировать профиль</h2>
          <EditOutlined style={{ color: 'var(--gray-400)' }} />
        </div>
        <div className={styles.cardBody}>
          <form onSubmit={hps(onProfile)}>
            <div className={styles.formGrid}>
              <Controller name="firstName" control={pc} render={({ field }) => (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-fn">Имя</label>
                  <input id="p-fn" className={styles.input} placeholder="Имя" maxLength={64} {...field} />
                </div>
              )} />
              <Controller name="lastName" control={pc} render={({ field }) => (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="p-ln">Фамилия</label>
                  <input id="p-ln" className={styles.input} placeholder="Фамилия" maxLength={64} {...field} />
                </div>
              )} />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={saving || !pd}>
                {saving ? 'Сохранение...' : <><CheckOutlined /> Сохранить</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Безопасность</h2></div>
        <div className={styles.cardBody}>
          <button className={styles.btnSecondary} onClick={() => setPwdModal(true)}>
            <LockOutlined style={{ marginRight: 8 }} />
            Сменить пароль
          </button>
        </div>
      </div>

      <Modal
        title="Смена пароля"
        open={pwdModal}
        onCancel={() => { setPwdModal(false); rw(); }}
        footer={null}
        destroyOnHidden
        styles={{ body: { paddingTop: 20 } }}
      >
        <form onSubmit={hpw(onPwd)}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Текущий пароль</label>
            <Controller name="currentPassword" control={wc} render={({ field }) => (
              <input type="password" className={styles.modalInput} placeholder="Текущий пароль" autoComplete="current-password" {...field} />
            )} />
            {we.currentPassword && <p className={styles.modalErr}>{we.currentPassword.message}</p>}
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Новый пароль</label>
            <Controller name="newPassword" control={wc} render={({ field }) => (
              <input type="password" className={styles.modalInput} placeholder="Минимум 8 символов" autoComplete="new-password" {...field} />
            )} />
            {we.newPassword && <p className={styles.modalErr}>{we.newPassword.message}</p>}
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={changingPwd}>
              {changingPwd ? 'Сохранение...' : 'Изменить пароль'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => { setPwdModal(false); rw(); }}>
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
