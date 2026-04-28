import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = ({ type = "success", title, message }) => {
    const id = crypto.randomUUID();

    setToasts((current) => [
      ...current,
      {
        id,
        type,
        title,
        message
      }
    ]);

    setTimeout(() => {
      removeToast(id);
    }, 3600);
  };

  const value = useMemo(() => {
    return {
      showToast,
      success: (message, title = "Success") =>
        showToast({
          type: "success",
          title,
          message
        }),
      error: (message, title = "Something went wrong") =>
        showToast({
          type: "error",
          title,
          message
        }),
      info: (message, title = "Info") =>
        showToast({
          type: "info",
          title,
          message
        })
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div>
              <strong>{toast.title}</strong>
              {toast.message && <p>{toast.message}</p>}
            </div>

            <button
              type="button"
              className="toast-close-button"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
