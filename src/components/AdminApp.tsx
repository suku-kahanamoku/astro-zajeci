import { lazy, Suspense, useState } from "react";
import Icon from "../modules/UIModule/Icon";
import { sections } from "../modules/AdminModule/registry";
import { url } from "../config/site";
import { t } from "../modules/LangModule";
import type {
  RecordData,
  FormConfig,
  Envelope,
} from "../modules/CoreModule/types";
const Dashboard = lazy(() => import("../modules/AdminModule/Dashboard"));
const Resource = lazy(() => import("../modules/AdminModule/Resource"));
const Mail = lazy(() => import("../modules/AdminModule/Mail"));
export default function AdminApp({
  section,
  mode,
  id,
  config,
  initial,
  locale = "cs",
  user,
  error = "",
}: {
  section: string;
  mode: string;
  id?: string;
  config?: FormConfig;
  initial: Envelope;
  locale?: string;
  user: RecordData;
  error?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const admin = (user.role?.name || user.role) === "admin";
  const title =
    config?.pageTitle ||
    (section === "profile"
      ? t("$.profile.title", locale)
      : t(
          sections.find(([name]) => name === section)?.[1] || "$.admin.title",
          locale,
        ));
  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-4 p-3 sm:p-4">
      <aside
        className={
          "admin-sidebar panel !p-2 shrink-0 h-fit sticky top-20 hidden lg:block " +
          (collapsed ? "w-16" : "w-64")
        }
      >
        <button
          className="icon-button w-full mb-3"
          aria-label="Sbalit navigaci"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>
        <nav>
          {admin && (
            <a
              href={url("/admin", locale)}
              aria-current={section === "dashboard" ? "page" : undefined}
            >
              <Icon name="heroicons:squares-2x2" />
              {!collapsed && t("$.admin.title", locale)}
            </a>
          )}
          {admin &&
            sections.map(([name, label, icon]) => (
              <a
                key={name}
                href={url("/admin/" + name, locale)}
                aria-current={section === name ? "page" : undefined}
                title={t(label, locale)}
              >
                <Icon name={icon} />
                {!collapsed && t(label, locale)}
              </a>
            ))}
          <a
            href={url("/admin/profile", locale)}
            aria-current={section === "profile" ? "page" : undefined}
          >
            <Icon name="heroicons:user" />
            {!collapsed && t("$.profile.title", locale)}
          </a>
        </nav>
        {!collapsed && (
          <div className="m-2 rounded-xl bg-primary/8 p-3 text-xs text-gray-500">
            <strong className="block mb-2">
              {t("$.layout.vineyard_overview", locale)}
            </strong>
            {t("$.layout.vineyard_overview_description", locale)}
          </div>
        )}
      </aside>
      <div className="min-w-0 flex-1 rounded-2xl border border-white/50 bg-white/35 dark:border-white/5 dark:bg-slate-950/25">
        <div className="lg:hidden p-4">
          <label className="field">
            {t("$.admin.title", locale)}
            <select
              className="input"
              value={section}
              onChange={(event) =>
                (location.href = url(
                  "/admin" +
                    (event.target.value === "dashboard"
                      ? ""
                      : "/" + event.target.value),
                  locale,
                ))
              }
            >
              {admin && (
                <option value="dashboard">{t("$.admin.title", locale)}</option>
              )}
              {admin &&
                sections.map(([name, label]) => (
                  <option key={name} value={name}>
                    {t(label, locale)}
                  </option>
                ))}
              <option value="profile">{t("$.profile.title", locale)}</option>
            </select>
          </label>
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-7 pt-6 pb-12">
          {section !== "dashboard" && (
            <>
              <nav className="text-sm text-gray-500 mb-2">
                <a href={url("/admin", locale)}>{t("$.admin.title", locale)}</a>{" "}
                › {title}
              </nav>
              <h1 className="page-title">{title}</h1>
            </>
          )}
          <Suspense
            fallback={
              <p role="status" className="p-8">
                {locale === "en" ? "Loading…" : "Načítání…"}
              </p>
            }
          >
            {section === "dashboard" ? (
              <Dashboard locale={locale} user={user} />
            ) : section === "mail" ? (
              <>
                {error && <p className="alert error">{error}</p>}
                <Mail
                  locale={locale}
                  templates={Array.isArray(initial.data) ? initial.data : []}
                />
              </>
            ) : (
              config && (
                <Resource
                  section={section}
                  mode={mode}
                  id={id}
                  locale={locale}
                  config={config}
                  initial={initial}
                  initialError={error}
                />
              )
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
