import { useEffect, useRef } from "react";
export default function Modal({
  title,
  children,
  onClose,
  closeButton = true,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closeButton?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="modal-panel"
    >
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-lg">{title}</h2>
        {closeButton && (
          <button
            autoFocus
            onClick={onClose}
            className="icon-button"
            aria-label="Zavřít"
          >
            ×
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
