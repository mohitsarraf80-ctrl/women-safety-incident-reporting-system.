import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

const borders: Record<ToastTone, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-sky-500',
  warning: 'border-l-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => remove(id), 6000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, message) => push({ title, message, tone: 'success' }),
      error: (title, message) => push({ title, message, tone: 'error' }),
      info: (title, message) => push({ title, message, tone: 'info' }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-lift animate-fade-in',
              borders[item.tone],
            )}
            role="status"
          >
            {icons[item.tone]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.message ? <p className="mt-0.5 text-xs text-slate-600">{item.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}
