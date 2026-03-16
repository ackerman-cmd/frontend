import { useEffect } from "react";
import { useAppDispatch } from "../../app/store/hooks";
import { _syncFromStorage } from "../../features/auth/model/authSlice";
import { ACCESS_TOKEN_KEY } from "../lib/constants";

export function useStorageSync() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== ACCESS_TOKEN_KEY) return;
      dispatch(_syncFromStorage(event.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [dispatch]);
}
