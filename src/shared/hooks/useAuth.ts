import { useAppSelector } from '../../app/store/hooks';
import { ROLE_ADMIN, ROLE_OPERATOR } from '../lib/constants';

export function useAuth() {
  const { token, user, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const roles = user?.roles ?? [];

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (required: string[]) =>
    required.length === 0 || required.some((r) => roles.includes(r));

  const isAdmin    = hasRole(ROLE_ADMIN);
  const isOperator = hasRole(ROLE_OPERATOR);

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isOperator,
    hasRole,
    hasAnyRole,
  };
}
