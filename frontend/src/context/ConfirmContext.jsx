import { createContext, useContext, useMemo, useState } from "react";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = ({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        title,
        message,
        confirmText,
        cancelText,
        danger,
        resolve
      });
    });
  };

  const handleClose = (result) => {
    if (confirmState?.resolve) {
      confirmState.resolve(result);
    }

    setConfirmState(null);
  };

  const value = useMemo(() => {
    return {
      confirm
    };
  }, []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {confirmState && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">{confirmState.danger ? "!" : "?"}</div>

            <div>
              <p className="eyebrow">Confirmation</p>
              <h2>{confirmState.title}</h2>
              <p>{confirmState.message}</p>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleClose(false)}
              >
                {confirmState.cancelText}
              </button>

              <button
                type="button"
                className={confirmState.danger ? "danger-button" : ""}
                onClick={() => handleClose(true)}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  return useContext(ConfirmContext);
};
