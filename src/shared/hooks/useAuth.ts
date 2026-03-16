import { useAppSelector } from '../../app/store/hooks';
import { ROLE_ADMIN } from '../lib/constants';

export function useAuth() {
  const { token, user, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const isAdmin = (user?.roles ?? []).includes(ROLE_ADMIN);

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
  };
}
