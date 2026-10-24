import { useEffect, useState } from "react";
import { api } from "../CoreModule/api";
import { money } from "../CoreModule/objects";
import Icon from "../UIModule/Icon";
import { url } from "../../config/site";
import { t } from "../LangModule";
import type { RecordData } from "../CoreModule/types";
export default function Dashboard({
  locale = "cs",
  user,
}: {
  locale?: string;
  user: RecordData;
}) {
  const [stats, setStats] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api("/api/wine?limit=5"),
      api("/api/admin/order?limit=5"),
      api("/api/admin/user?limit=5"),
    ])
      .then(([wines, orders, users]) => {
        if (active) setStats({ wine: wines, order: orders, user: users });
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-6">
      <section className="crm-hero-panel p-7 sm:p-9">
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">
            {t("$.dashboard.eyebrow", locale)}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {t("$.dashboard.greeting", locale, {
              name: user.first_name || t("$.dashboard.administrator", locale),
            })}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/85 sm:text-lg">
            {t("$.dashboard.description", locale)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="btn secondary"
              href={url("/admin/wine/create", locale)}
            >
              + {t("$.dashboard.new_wine", locale)}
            </a>
            <a className="btn !bg-white/15" href={url("/admin/order", locale)}>
              {t("$.dashboard.browse_orders", locale)} →
            </a>
          </div>
        </div>
      </section>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["wine", "wines", "heroicons:beaker"],
          ["order", "orders", "heroicons:shopping-bag"],
          ["user", "users", "heroicons:users"],
        ].map(([key, label, icon], index) => (
          <a
            key={key}
            href={url("/admin/" + key, locale)}
            className={
              "panel group relative overflow-hidden !p-6 transition hover:-translate-y-1 hover:shadow-xl " +
              (index === 0
                ? "bg-linear-to-br from-primary-50 to-white"
                : index === 1
                  ? "bg-linear-to-br from-secondary-50 to-white"
                  : "bg-linear-to-br from-cyan-50 to-white")
            }
          >
            <span
              className={
                "grid size-12 place-items-center rounded-2xl shadow-lg text-white " +
                (index === 1
                  ? "bg-secondary-500"
                  : index === 2
                    ? "bg-cyan-600"
                    : "bg-primary-600")
              }
            >
              <Icon name={icon} size={24} />
            </span>
            <p className="mt-8 text-4xl font-extrabold">
              {stats
                ? (stats[key]?.meta?.total ?? stats[key]?.data?.length ?? 0)
                : "…"}
            </p>
            <p className="mt-1 font-bold text-gray-500">
              {t("$.admin.quick." + label, locale)}
            </p>
          </a>
        ))}
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="crm-eyebrow">
                {t("$.dashboard.recent_activity", locale)}
              </p>
              <h2 className="text-xl font-extrabold">
                {t("$.dashboard.recent_orders", locale)}
              </h2>
            </div>
            <a href={url("/admin/order", locale)}>
              {t("$.dashboard.all_orders", locale)} →
            </a>
          </div>
          {stats?.order?.data?.length ? (
            stats.order.data.map((order: any) => (
              <a
                key={order.id}
                href={url("/admin/order/" + order.id, locale)}
                className="flex items-center gap-4 py-3.5 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10">
                  <Icon name="heroicons:shopping-bag" />
                </span>
                <span className="flex-1 min-w-0">
                  <strong className="block">
                    {order.order_number || "#" + order.id}
                  </strong>
                  <span className="text-sm text-gray-500">
                    {order.user?.email || order.customer?.email}
                  </span>
                </span>
                <strong className="text-sm">
                  {money(order.total_price, locale)}
                </strong>
              </a>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500">
              {stats ? t("$.dashboard.no_orders", locale) : "…"}
            </p>
          )}
        </div>
        <div className="panel">
          <p className="crm-eyebrow">{t("$.dashboard.cellar", locale)}</p>
          <h2 className="text-xl font-extrabold mb-6">
            {t("$.dashboard.latest_wines", locale)}
          </h2>
          <div className="space-y-3">
            {stats?.wine?.data?.map((wine: any) => (
              <a
                key={wine.id}
                href={url("/admin/wine/" + wine.id, locale)}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
              >
                <Icon name="heroicons:beaker" />
                <span className="flex-1 min-w-0">
                  <strong className="block truncate">{wine.name}</strong>
                  <span className="text-xs text-gray-500">
                    {t("$.dashboard.stock", locale, {
                      count: wine.stock_quantity ?? 0,
                    })}
                  </span>
                </span>
                <strong className="text-sm">{money(wine.price, locale)}</strong>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
