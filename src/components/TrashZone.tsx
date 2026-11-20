import { forwardRef } from "react";

export const TrashZone = forwardRef<HTMLDivElement, { active: boolean; visible: boolean }>(
  function TrashZone({ active, visible }, ref) {
    return (
      <div
        ref={ref}
        className="trash"
        data-active={active || undefined}
        data-visible={visible || undefined}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
          <path
            d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{active ? "Release to delete" : "Drop here to delete"}</span>
      </div>
    );
  },
);
