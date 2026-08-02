import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react-native';

export type ToastType = 'default' | 'success' | 'warn' | 'failed';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => string;
  success: (message: string, duration?: number) => string;
  warn: (message: string, duration?: number) => string;
  failed: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

type ToastStyleConfig = {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  Icon: any;
};

const TOAST_STYLES: Record<ToastType, ToastStyleConfig> = {
  success: {
    bg: '#ffffff',
    border: '#bbf7d0',
    iconBg: '#e6f9f0',
    iconColor: '#0ea360',
    Icon: CheckCircle2,
  },
  warn: {
    bg: '#ffffff',
    border: '#fde68a',
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    Icon: AlertTriangle,
  },
  failed: {
    bg: '#ffffff',
    border: '#fecaca',
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    Icon: XCircle,
  },
  default: {
    bg: '#ffffff',
    border: '#e2e8f0',
    iconBg: '#f1f5f9',
    iconColor: '#475569',
    Icon: Info,
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const { bg, border, iconBg, iconColor, Icon } = TOAST_STYLES[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: toast.duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -16,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bg, borderColor: border, opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleDismiss}
        style={styles.toastContentRow}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} />
        </View>

        <Text style={styles.toastText} numberOfLines={3}>
          {toast.message}
        </Text>

        <TouchableOpacity onPress={handleDismiss} hitSlop={8} style={styles.closeBtn}>
          <X size={16} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: barWidth, backgroundColor: iconColor }]}
        />
      </View>
    </Animated.View>
  );
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    const type = options?.type || 'default';
    const duration = options?.duration || 3000;

    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);

    return id;
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'success', duration }),
    [showToast]
  );

  const warn = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'warn', duration }),
    [showToast]
  );

  const failed = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'failed', duration }),
    [showToast]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, warn, failed, dismiss, dismissAll }}>
      {children}
      <View
        style={[styles.toastContainer, { top: insets.top + 10 }]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  toastContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  progressFill: {
    height: 3,
  },
});