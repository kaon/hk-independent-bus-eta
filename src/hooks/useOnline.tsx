import { useSyncExternalStore } from "react";

// One shared pair of window listeners, no matter how many rows call useOnline().
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
  if (listeners.size === 0) {
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      window.removeEventListener("online", notify);
      window.removeEventListener("offline", notify);
    }
  };
};

const getSnapshot = (): "online" | "offline" =>
  navigator.onLine ? "online" : "offline";

const useOnline = () => useSyncExternalStore(subscribe, getSnapshot);

export default useOnline;
