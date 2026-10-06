import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ToastType = 'default' | 'success' | 'warn' | 'failed';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  closing?: boolean;
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

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 3500;

const ACCENTS: Record<ToastType, { dark: string; light: string; glyph: string }> = {
  default: { dark: '#8AA4FF', light: '#4361EE', glyph: 'i' },
  success: { dark: '#3DDC97', light: '#0E9F6E', glyph: '✓' },
  warn: { dark: '#F5B942', light: '#B7791F', glyph: '!' },
  failed: { dark: '#FF6B6B', light: '#D64545', glyph: '✕' },
};

const SURFACE = {
  dark: { bg: '#1A1C22', border: '#2A2D36', text: '#F2F3F5', track: '#2A2D36' },
  light: { bg: '#FFFFFF', border: '#E4E6EB', text: '#161922', track: '#EEF0F4' },
};

const ROLE_LABEL: Record<ToastType, string> = {
  default: 'Notice',
  success: 'Success',
  warn: 'Warning',
  failed: 'Error',
};

/* -------------------------------------------------------------------------- */
/*  Single toast                                                              */
/* -------------------------------------------------------------------------- */

interface ToastItemProps {
  toast: Toast;
  scheme: 'dark' | 'light';
  onClose: (id: string) => void;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, scheme, onClose, onRemove }) => {
  const { id, type, message, duration, closing } = toast;
  const surface = SURFACE[scheme];
  const accent = ACCENTS[type][scheme];

  const enter = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const exited = useRef(false);

  // Enter + countdown
  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      damping: 16,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    const countdown = Animated.timing(progress, {
      toValue: 0,
      duration,
      easing: Easing.linear,
      useNativeDriver: false, // animating width
    });
    countdown.start(({ finished }) => {
      if (finished) onClose(id);
    });

    return () => countdown.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit
  useEffect(() => {
    if (!closing || exited.current) return;
    exited.current = true;
    progress.stopAnimation();
    Animated.timing(enter, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onRemove(id));
  }, [closing, enter, id, onRemove, progress]);

  // Swipe up (or sideways) to dismiss
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => drag.setValue(Math.min(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy < -28 || g.vy < -0.6) {
            Animated.timing(drag, {
              toValue: -80,
              duration: 120,
              useNativeDriver: true,
            }).start(() => onClose(id));
          } else {
            Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }),
    [drag, id, onClose]
  );

  const translateY = Animated.add(
    enter.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }),
    drag
  );
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View
      {...pan.panHandlers}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${ROLE_LABEL[type]}: ${message}`}
      style={[
        styles.toast,
        {
          backgroundColor: surface.bg,
          borderColor: surface.border,
          opacity: enter,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={() => onClose(id)}
        accessibilityHint="Double tap to dismiss"
        style={styles.row}
      >
        <View style={[styles.badge, { backgroundColor: accent + '26' }]}>
          <Text style={[styles.glyph, { color: accent }]}>{ACCENTS[type].glyph}</Text>
        </View>
        <Text style={[styles.message, { color: surface.text }]} numberOfLines={3}>
          {message}
        </Text>
      </Pressable>

      <View style={[styles.track, { backgroundColor: surface.track }]}>
        <Animated.View style={[styles.bar, { backgroundColor: accent, width }]} />
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

let counter = 0;
const nextId = () => `toast-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const scheme: 'dark' | 'light' = useColorScheme() === 'light' ? 'light' : 'dark';

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = nextId();
    const type = options?.type ?? 'default';
    const duration = options?.duration ?? DEFAULT_DURATION;

    setToasts((prev) => {
      const next = [...prev, { id, message, type, duration }];
      // Past the cap, start closing the oldest still-open toasts
      const open = next.filter((t) => !t.closing);
      const overflow = open.length - MAX_VISIBLE;
      if (overflow > 0) {
        const toClose = new Set(open.slice(0, overflow).map((t) => t.id));
        return next.map((t) => (toClose.has(t.id) ? { ...t, closing: true } : t));
      }
      return next;
    });

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

  // Starts the exit animation; the item removes itself when it finishes
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, closing: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ showToast, success, warn, failed, dismiss, dismissAll }),
    [showToast, success, warn, failed, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            scheme={scheme}
            onClose={dismiss}
            onRemove={remove}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    minHeight: 56,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  glyph: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  message: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  track: {
    height: 3,
    width: '100%',
  },
  bar: {
    height: 3,
  },
});