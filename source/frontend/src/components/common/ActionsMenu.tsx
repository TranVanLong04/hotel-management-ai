import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface ActionsMenuProps {
  actions: ActionMenuItem[];
  align?: 'left' | 'right';
}

export function ActionsMenu({ actions, align = 'right' }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        title="Thao tác"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-1 min-w-[160px] rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {actions.map((action, idx) => (
            <div key={idx}>
              {action.divider && (
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              )}
              <button
                type="button"
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                  action.onClick();
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  action.disabled
                    ? 'cursor-not-allowed opacity-40'
                    : action.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {action.icon && <action.icon className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{action.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

