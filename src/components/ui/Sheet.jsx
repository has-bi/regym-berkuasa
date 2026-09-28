"use client";
import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

/**
 * Bottom sheet on mobile, centred dialog from `sm` up.
 * Locks background scroll and closes on Escape / backdrop tap.
 */
export default function Sheet({ title, subtitle, onClose, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl
                   shadow-2xl flex flex-col max-h-[88vh] animate-slide-up sm:animate-pop-in"
      >
        {/* Drag affordance — signals the sheet is dismissible on touch */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 rounded-full bg-line-strong" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-4 shrink-0">
          <div className="min-w-0">
            {subtitle && (
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">
                {subtitle}
              </p>
            )}
            <h2 className="text-lg font-semibold text-ink leading-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-icon shrink-0 -mr-1 -mt-0.5"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 flex-1">{children}</div>

        {footer && (
          <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shrink-0 border-t border-line bg-surface rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
