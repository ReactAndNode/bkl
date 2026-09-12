"use client";

import { useState, useSyncExternalStore } from "react";
import { readSessions, type Session } from "./game";

const STORAGE_KEY = "sumday-sessions-v1";
interface Progress { sessions: Session[]; ready: boolean; storageIssue: boolean }
const SERVER_SNAPSHOT: Progress = { sessions: [], ready: false, storageIssue: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

// Each mounted game owns a cached snapshot, while storage events keep tabs in sync.
function createProgressStore() {
  let snapshot = SERVER_SNAPSHOT;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  const getSnapshot = () => {
    if (!snapshot.ready && typeof window !== "undefined") {
      try {
        snapshot = { sessions: readSessions(localStorage.getItem(STORAGE_KEY)), ready: true, storageIssue: false };
      } catch {
        snapshot = { sessions: [], ready: true, storageIssue: true };
      }
    }
    return snapshot;
  };
  const synchronize = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    snapshot = { sessions: readSessions(event.newValue), ready: true, storageIssue: false };
    notify();
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener("storage", synchronize);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", synchronize);
    };
  };
  const recordSession = (session: Session) => {
    const current = getSnapshot();
    let existing = current.sessions;
    let storageIssue = false;
    try { existing = readSessions(localStorage.getItem(STORAGE_KEY)); }
    catch { storageIssue = true; }
    const sessions = [...new Map([...existing, ...current.sessions, session].map(item => [item.id, item])).values()];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
    catch { storageIssue = true; }
    snapshot = { sessions, ready: true, storageIssue };
    notify();
  };
  return { getSnapshot, subscribe, recordSession };
}

export function useProgress() {
  const [store] = useState(createProgressStore);
  const progress = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
  return { ...progress, recordSession: store.recordSession };
}
