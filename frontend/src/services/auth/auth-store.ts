import type { AuthUser } from "../../types/auth";

interface AuthStoreSnapshot {
  accessToken: string | null;
  usuario: AuthUser | null;
}

type Listener = () => void;

let snapshot: AuthStoreSnapshot = {
  accessToken: null,
  usuario: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export const authStore = {
  getSnapshot(): AuthStoreSnapshot {
    return snapshot;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  setSession(accessToken: string, usuario: AuthUser) {
    snapshot = {
      accessToken,
      usuario,
    };

    emit();
  },

  clear() {
    if (!snapshot.accessToken && !snapshot.usuario) return;

    snapshot = {
      accessToken: null,
      usuario: null,
    };

    emit();
  },
};
