import { useEffect, useState } from "react";
import { ShoppingCart, Sun, Moon, Menu, X, UserRound } from "lucide-react";
import { useCart } from "../modules/ShopModule/cart";
import { t } from "../modules/LangModule";
import { url } from "../config/site";
import { api } from "../modules/CoreModule/api";
import type { RecordData } from "../modules/CoreModule/types";
import { useHydrated } from "../modules/UIModule/useHydrated";
import Logo from "./Logo";
export default function Header({
  locale = "cs",
  user = null,
  admin = false,
}: {
  locale?: string;
  user?: RecordData | null;
  admin?: boolean;
}) {
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const cart = useCart();
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const links = [
    ["about", "/#about"],
    ["wine", "/wine"],
    ["taste", "/#tasting"],
    ["contact", "/#contact"],
    ["gallery", "/gallery"],
  ];
  function theme() {
    const value = !dark;
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
    try {
      localStorage.setItem("nuxt-color-mode", value ? "dark" : "light");
    } catch {}
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <a
          href={url("/", locale)}
          aria-label={t("$.base.title", locale)}
          className="block w-24 -ms-4 sm:-ms-6 lg:-ms-8 shrink-0"
        >
          <Logo />
        </a>
        <nav
          className="hidden lg:flex gap-6 text-sm font-semibold"
          aria-label="Hlavní navigace"
        >
          {links.map(([key, path]) => (
            <a key={key} href={url(path, locale)}>
              {t("$.navbar." + key, locale)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            className="icon-button relative"
            href={url("/cashdesk", locale)}
            aria-label={t("$.cashdesk.title", locale)}
          >
            <ShoppingCart size={23} />
            {cart.carts.length > 0 && (
              <span className="cart-badge">{cart.carts.length}</span>
            )}
          </a>
          <button
            disabled={!ready}
            className="icon-button"
            onClick={theme}
            aria-label={t(dark ? "$.theme.light" : "$.theme.dark", locale)}
          >
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          {admin && (
            <span className="hidden xl:block text-xs text-green-700 dark:text-green-300">
              ● {t("$.layout.admin_online", locale)}
            </span>
          )}
          {user ? (
            <details className="profile-menu">
              <summary
                className="icon-button"
                aria-label={t("$.navbar.profile", locale)}
              >
                <UserRound size={22} />
              </summary>
              <nav>
                <a href={url("/admin", locale)}>{t("$.admin.title", locale)}</a>
                <a href={url("/admin/profile", locale)}>
                  {t("$.profile.title", locale)}
                </a>
                <button
                  onClick={async () => {
                    await api("/api/auth/logout", "POST");
                    location.href = url("/login", locale);
                  }}
                >
                  {t("$.navbar.logout", locale)}
                </button>
              </nav>
            </details>
          ) : (
            <>
              <a
                className="btn outline secondary small"
                data-testid="menu-login"
                href={url("/login", locale)}
              >
                {t("$.navbar.login", locale)}
              </a>
              <a
                className="hidden sm:inline text-sm"
                data-testid="menu-signup"
                href={url("/signup", locale)}
              >
                {t("$.navbar.signup", locale)}
              </a>
            </>
          )}
          <button
            disabled={!ready}
            className="lg:hidden icon-button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("$.aria.hamburger", locale)}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav">
          {links.map(([key, path]) => (
            <a
              key={key}
              href={url(path, locale)}
              onClick={() => setOpen(false)}
            >
              {t("$.navbar." + key, locale)}
            </a>
          ))}
          <a href={url("/signup", locale)}>{t("$.navbar.signup", locale)}</a>
        </nav>
      )}
    </header>
  );
}
