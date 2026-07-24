export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

export function useToast() {
  const toasts = useState<ToastItem[]>('global-toasts', () => []);

  const remove = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  const show = (options: ToastOptions) => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duration = options.duration ?? 4000;
    const type = options.type || 'info';

    const toastItem: ToastItem = {
      id,
      title: options.title,
      message: options.message,
      type,
      duration
    };

    if (toasts.value.length >= 5) {
      toasts.value.shift();
    }

    toasts.value.push(toastItem);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  };

  const success = (message: string, title?: string, duration?: number) => {
    return show({ message, title, type: 'success', duration });
  };

  const error = (message: string, title?: string, duration?: number) => {
    return show({ message, title, type: 'error', duration });
  };

  const info = (message: string, title?: string, duration?: number) => {
    return show({ message, title, type: 'info', duration });
  };

  const warning = (message: string, title?: string, duration?: number) => {
    return show({ message, title, type: 'warning', duration });
  };

  const clear = () => {
    toasts.value = [];
  };

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    remove,
    clear
  };
}
