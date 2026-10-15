"use client";
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

const FIELD = "input, textarea, select";

/** Brings a focused field to the middle of whatever is still visible. */
function reveal(el) {
  if (el?.matches?.(FIELD)) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Bottom sheet on mobile, centred dialog from `sm` up.
 * Locks background scroll and closes on Escape / backdrop tap.
 *
 * The on-screen keyboard does not shrink a fixed-position layer on iOS, and
 * by default not on Android either, so a sheet pinned to the bottom ends up
 * behind the keyboard with the field being typed into out of sight. The
 * sheet therefore sizes itself to the visual viewport — the part of the
 * screen the keyboard leaves — and scrolls the focused field into view.
 */
export default function Sheet({ title, subtitle, onClose, children, footer }) {
  const panelRef = useRef(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const place = () => setBox({ top: vv.offsetTop, height: vv.height });
    // The keyboard finishes opening after focus; re-centre once it has. Only
    // on resize — a scroll can be the user pinch-zooming, and that is theirs.
    const resize = () => {
      place();
      reveal(document.activeElement);
    };
    place();
    vv.addEventListener("resize", resize);
    vv.addEventListener("scroll", place);
    return () => {
      vv.removeEventListener("resize", resize);
      vv.removeEventListener("scroll", place);
    };
  }, []);

  // Browsers without visualViewport events still get the field brought up.
  const onFocus = (e) => {
    const el = e.target;
    setTimeout(() => reveal(el), 300);
  };

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
    <div
      className="fixed inset-x-0 top-0 h-full z-50 flex items-end sm:items-center justify-center"
      style={box ? { top: box.top, height: box.height } : undefined}
    >
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
        onFocus={onFocus}
        className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl
                   shadow-2xl flex flex-col max-h-[88%] animate-slide-up sm:animate-pop-in"
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
