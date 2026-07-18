"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, ttl?: number) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, ttl = 4000) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((s) => [...s, { id, type, message }]);
    if (ttl > 0) {
      setTimeout(() => removeToast(id), ttl);
    }
  }, [removeToast]);

  useEffect(() => {
    return () => {
      // cleanup any timers implicitly when unmounting by clearing toasts
      setToasts([]);
    };
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
              }`}
            role="status"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 pr-2">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

