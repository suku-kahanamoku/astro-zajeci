import { useEffect, useState } from "react";
import Modal from "../modules/UIModule/Modal";
export default function Promotion() {
  const [open, setOpen] = useState(false);
  const key = "homepage-promotion-2026-08-26-closed";
  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(key) !== "true");
    } catch {
      setOpen(true);
    }
  }, []);
  return open ? (
    <Modal
      title="Zaječská letošní vína 2026"
      onClose={() => {
        setOpen(false);
        try {
          sessionStorage.setItem(key, "true");
        } catch {}
      }}
    >
      <img
        src="/img/2026-08-26.jpeg"
        width="1276"
        height="1595"
        className="block max-h-[80vh] w-auto max-w-full object-contain mx-auto"
        alt="Pozvánka na Zaječská letošní vína 2026"
      />
    </Modal>
  ) : null;
}
