import { useState, useEffect } from "react";
import { t } from "../modules/LangModule";
import Icon from "../modules/UIModule/Icon";
export default function CookieBanner({ locale = "cs" }: { locale?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(
      !document.cookie
        .split(";")
        .some((part) => part.trim().startsWith("_cookies=")),
    );
  }, []);
  return open ? (
    <div className="cookie-banner">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <Icon name="mdi:cookie" size={36} className="text-primary-500" />
        <p className="text-sm flex-1">{t("$.footer.cookies", locale)}</p>
        <button
          className="btn secondary small"
          data-testid="cookie-banner-close"
          onClick={() => {
            document.cookie =
              "_cookies=1; Max-Age=31536000; Path=/; SameSite=Lax";
            setOpen(false);
          }}
        >
          {t("$.btn.close", locale)}
        </button>
      </div>
    </div>
  ) : null;
}
