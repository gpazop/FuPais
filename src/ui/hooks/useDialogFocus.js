import { useLayoutEffect, useRef } from "react";

const focusableSelector = 'button, input, select, textarea, a[href], [tabindex]';

export function useDialogFocus(open, onClose, initialFocusRef) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const controls = () => Array.from(dialog.querySelectorAll(focusableSelector))
      .filter((element) => element.tabIndex >= 0 &&
        !element.matches(":disabled, input[type=hidden]") &&
        !element.closest("[hidden], [inert]"));
    const focusFirst = () => (initialFocusRef?.current || controls()[0] || dialog).focus();
    focusFirst();

    const keepFocusInside = (event) => {
      if (!dialog.contains(event.target)) focusFirst();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current?.();
      }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items.at(-1);
      const active = document.activeElement;
      if (!items.includes(active) || active === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last || dialog : first || dialog).focus();
      }
    };
    document.addEventListener("focusin", keepFocusInside);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      dialog.removeEventListener("keydown", handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, initialFocusRef]);

  return dialogRef;
}
