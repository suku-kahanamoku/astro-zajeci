import { useState } from "react";
import Form, { FieldInput } from "../UIModule/Form";
import Modal from "../UIModule/Modal";
import { api } from "../CoreModule/api";
import { get, money, fileUrl } from "../CoreModule/objects";
import { t } from "../LangModule";
import { url } from "../../config/site";
import { resolveConfigPath } from "./registry";
import Files, { FilePicker, attachFiles } from "./Files";
import type { FormConfig, RecordData, Envelope } from "../CoreModule/types";
import { useHydrated } from "../UIModule/useHydrated";
export default function Resource({
  section,
  mode,
  id,
  config,
  initial,
  locale = "cs",
  initialError = "",
}: {
  section: string;
  mode: string;
  id?: string;
  config: FormConfig;
  initial: Envelope;
  locale?: string;
  initialError?: string;
}) {
  const [result, setResult] = useState(initial);
  const ready = useHydrated();
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);
  const rows = Array.isArray(result.data) ? result.data : [];
  const item = mode === "create" ? {} : result.data || {};
  const pageUrl = () => new URL(location.href);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const endpoint = new URL(
        resolveConfigPath(config.restUrl, id),
        location.origin,
      );
      const current = pageUrl();
      for (const key of ["q", "page", "limit", "sort"])
        if (current.searchParams.has(key))
          endpoint.searchParams.set(key, current.searchParams.get(key)!);
      if (mode === "list" && !endpoint.searchParams.has("limit"))
        endpoint.searchParams.set(
          "limit",
          String(config.pagination?.limit || 20),
        );
      setResult(await api(endpoint.pathname + endpoint.search));
      setRevision((value) => value + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  function navigateParams(patch: Record<string, string>) {
    const current = pageUrl();
    if (current.searchParams.has(config.syscode)) {
      current.searchParams.delete(config.syscode);
      if (Object.keys(config.currentFilter || {}).length)
        current.searchParams.set("q", JSON.stringify(config.currentFilter));
      if (config.currentSort?.length)
        current.searchParams.set("sort", JSON.stringify(config.currentSort));
      if (result.meta?.limit)
        current.searchParams.set("limit", String(result.meta.limit));
      if (result.meta?.page)
        current.searchParams.set("page", String(result.meta.page));
    }
    for (const [key, value] of Object.entries(patch))
      value
        ? current.searchParams.set(key, value)
        : current.searchParams.delete(key);
    location.href = current.href;
  }
  function detail(row: RecordData) {
    const template = config.factory?.url || "${id}";
    const slug = template.replace(/\$\{([^}]+)\}/g, (_: string, key: string) =>
      String(get(row, key) ?? ""),
    );
    return url("/admin/" + section + "/" + encodeURIComponent(slug), locale);
  }
  if (mode === "list")
    return (
      <div className="space-y-5">
        <div className="flex justify-between flex-wrap gap-3">
          {section !== "user" && (
            <a
              className="btn"
              href={url("/admin/" + section + "/create", locale)}
            >
              + {t("$.btn.create", locale)}
            </a>
          )}
          <div className="flex gap-3">
            {config.deleteUrl && (
              <button
                className="btn outline secondary"
                disabled={!selected.length}
                onClick={() => setConfirm(true)}
              >
                {t("$.btn.delete", locale)} ({selected.length})
              </button>
            )}
            <button
              className="btn outline"
              onClick={refresh}
              disabled={loading || !ready}
            >
              ↻
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="alert error">
            {error}
          </p>
        )}
        <div className="panel !p-0 table-scroll" aria-busy={loading}>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    disabled={!ready}
                    aria-label="Vybrat vše"
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked ? rows.map((row) => row.id) : [],
                      )
                    }
                  />
                </th>
                {config.fields.map((field) => (
                  <th key={field.name}>
                    <button
                      disabled={!ready}
                      onClick={() => {
                        const current = pageUrl().searchParams.get("sort");
                        let direction = 1;
                        try {
                          direction =
                            JSON.parse(
                              current ||
                                JSON.stringify(config.currentSort || []),
                            )[0]?.[field.name] === 1
                              ? -1
                              : 1;
                        } catch {}
                        navigateParams({
                          sort: JSON.stringify([{ [field.name]: direction }]),
                          page: "1",
                        });
                      }}
                    >
                      {t(field.label, locale)} ↕
                    </button>
                  </th>
                ))}
              </tr>
              <tr>
                <th />
                <th colSpan={config.fields.length}>
                  <form
                    className="flex gap-3 items-end min-w-[700px]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      let base: any = {};
                      try {
                        base = JSON.parse(
                          new URL(
                            config.restUrl,
                            location.origin,
                          ).searchParams.get("q") || "{}",
                        );
                      } catch {}
                      for (const field of config.fields) {
                        const value = form.get(field.name);
                        if (value !== null && value !== "")
                          base[field.name] = {
                            [String(
                              form.get("operator:" + field.name) ||
                                field.operator?.value ||
                                (field.type === "select" ||
                                field.type === "number"
                                  ? "$eq"
                                  : "$regex"),
                            )]:
                              field.type === "number"
                                ? Number(value)
                                : (field.options?.find(
                                    (option: any) =>
                                      String(option.value) === value,
                                  )?.value ?? value),
                          };
                      }
                      navigateParams({ q: JSON.stringify(base), page: "1" });
                    }}
                  >
                    {config.fields.map((field) => {
                      let filters: any = {};
                      filters = config.currentFilter || {};
                      const condition = filters[field.name];
                      const initial =
                        condition && typeof condition === "object"
                          ? Object.values(condition)[0]
                          : condition;
                      return (
                        <Filter
                          key={field.name}
                          field={field}
                          initial={initial}
                          operator={
                            condition && typeof condition === "object"
                              ? Object.keys(condition)[0]
                              : undefined
                          }
                          locale={locale}
                        />
                      );
                    })}
                    <button className="btn small" type="submit">
                      {t("$.btn.filter", locale)}
                    </button>
                    <button
                      className="btn outline small"
                      type="button"
                      onClick={() => navigateParams({ q: "", page: "1" })}
                    >
                      ×
                    </button>
                  </form>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      disabled={!ready}
                      aria-label={String(row.name || row.label || row.id)}
                      checked={selected.includes(row.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, row.id]
                            : selected.filter((value) => value !== row.id),
                        )
                      }
                    />
                  </td>
                  {config.fields.map((field, index) => {
                    let value = get(row, field.colName || field.name);
                    if (field.name === "role" && typeof value === "object")
                      value = value?.label || value?.name;
                    const label = field.options?.find(
                      (option: any) => String(option.value) === String(value),
                    )?.label;
                    return (
                      <td key={field.name}>
                        {index === 0 ? (
                          <a
                            className="font-semibold text-primary-500"
                            href={detail(row)}
                          >
                            {String(value ?? row.id)}
                          </a>
                        ) : label ? (
                          t(label, locale)
                        ) : typeof value === "object" ? (
                          JSON.stringify(value)
                        ) : (
                          String(value ?? "—")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={config.fields.length + 1}
                    className="text-center"
                  >
                    {t("$.table.empty", locale)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <span>
            {result.meta?.total ?? rows.length} {t("$.table.records", locale)}
          </span>
          <select
            className="input !w-auto"
            aria-label={
              locale === "en" ? "Records per page" : "Záznamů na stránce"
            }
            value={result.meta?.limit || 20}
            onChange={(event) =>
              navigateParams({ limit: event.target.value, page: "1" })
            }
          >
            {[20, 50, 100].map((limit) => (
              <option value={limit} key={limit}>
                {limit}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            <button
              className="btn outline"
              disabled={!ready || (result.meta?.page || 1) <= 1}
              onClick={() =>
                navigateParams({ page: String((result.meta?.page || 1) - 1) })
              }
            >
              ←
            </button>
            <span>
              {result.meta?.page || 1} / {result.meta?.totalPages || 1}
            </span>
            <button
              className="btn outline"
              disabled={
                (result.meta?.page || 1) >= (result.meta?.totalPages || 1)
              }
              onClick={() =>
                navigateParams({ page: String((result.meta?.page || 1) + 1) })
              }
            >
              →
            </button>
          </div>
        </div>
        {confirm && (
          <Modal
            title={t("$.btn.delete", locale)}
            onClose={() => setConfirm(false)}
          >
            <div className="p-6 space-y-5">
              <p>
                {t("$.message.delete_question_multi", locale, {
                  length: selected.length,
                })}
              </p>
              <button
                className="btn secondary"
                disabled={loading || !ready}
                onClick={async () => {
                  setLoading(true);
                  try {
                    for (const value of selected)
                      await api(
                        resolveConfigPath(config.deleteUrl, String(value)),
                        "DELETE",
                      );
                    setSelected([]);
                    setConfirm(false);
                    await refresh();
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {t("$.btn.delete", locale)}
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  if (section === "order" && item.id)
    return <OrderDetail item={item} locale={locale} />;
  return (
    <div className="space-y-6">
      {saved && (
        <p role="status" className="alert">
          {t("$.message.patch_success_msg", locale)}
        </p>
      )}
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {(mode === "create" || item.id) && (
        <div className="panel">
          <Form
            key={revision}
            fields={
              section === "invoice"
                ? config.fields.map((field) =>
                    ["due_at", "note"].includes(field.name)
                      ? { ...field, disabled: true }
                      : field,
                  )
                : config.fields
            }
            item={item}
            locale={locale}
            cancel={url("/admin/" + section, locale)}
            onSubmit={async (body) => {
              const payload = {
                ...body,
                ...(body.data ? { data: { ...item.data, ...body.data } } : {}),
              };
              const endpoint = resolveConfigPath(
                mode === "create"
                  ? config.postUrl
                  : section === "profile"
                    ? "/api/auth/profile"
                    : config.patchUrl,
                id || String(item.id),
              );
              const saved = await api(
                endpoint,
                mode === "create" ? "POST" : "PATCH",
                payload,
              );
              if (mode === "create" && section === "wine" && files.length) {
                try {
                  await attachFiles(files, saved.data);
                } catch (err) {
                  location.href =
                    url("/admin/wine/" + saved.data.id, locale) +
                    "?uploadError=1";
                  return;
                }
              }
              if (section === "profile") {
                setResult(saved);
                setRevision((value) => value + 1);
                setSaved(true);
              } else location.href = url("/admin/" + section, locale);
            }}
          >
            {mode === "create" && section === "wine" && (
              <FilePicker onChange={setFiles} locale={locale} />
            )}
          </Form>
        </div>
      )}
      {section === "wine" && item.id && (
        <Files item={item} locale={locale} onRefresh={refresh} />
      )}{" "}
      {section === "invoice" && item.files?.length > 0 && (
        <div className="panel flex flex-wrap gap-3">
          {item.files.map((file: any) => (
            <a
              className="btn outline"
              key={file.id}
              target="_blank"
              rel="noreferrer"
              href={fileUrl(file.path)}
            >
              {file.name || "PDF"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
function Filter({
  field,
  initial,
  locale,
  operator,
}: {
  field: any;
  initial: any;
  locale: string;
  operator?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  return (
    <div className="min-w-32 flex-1">
      <FieldInput
        field={{ ...field, required: false }}
        value={value}
        onChange={setValue}
        locale={locale}
      />
      {field.operator?.enabled && (
        <select
          name={"operator:" + field.name}
          defaultValue={operator || field.operator.value || "$eq"}
          aria-label={
            (locale === "en" ? "Operator: " : "Operátor: ") +
            t(field.label, locale)
          }
          className="input !min-h-0 !py-1 !text-xs mt-1"
        >
          {[
            ["$eq", "="],
            ["$ne", "≠"],
            ["$regex", locale === "en" ? "Contains" : "Obsahuje"],
            ["$gt", ">"],
            ["$gte", "≥"],
            ["$lt", "<"],
            ["$lte", "≤"],
          ].map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
function OrderDetail({ item, locale }: { item: RecordData; locale: string }) {
  const customer = item.customer || item.user || {};
  const address = (data: any) =>
    [
      data?.name,
      data?.company,
      data?.street,
      [data?.zip, data?.city].filter(Boolean).join(" "),
      data?.country,
    ]
      .filter(Boolean)
      .join(", ");
  return (
    <article className="panel space-y-6">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-primary-600">
          {t("$.order.title", locale)} {item.order_number}
        </h2>
        <span>{item.status}</span>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-bold mb-3">{t("$.order.customer", locale)}</h3>
          <p>
            {customer.first_name} {customer.last_name}
          </p>
          <p>{customer.email}</p>
          <p>{customer.phone}</p>
          <p className="font-bold mt-3">
            {t("$.cashdesk.billing_address", locale)}
          </p>
          <p>{address(customer.billing_address)}</p>
          <p className="font-bold mt-3">
            {t("$.cashdesk.shipping_address", locale)}
          </p>
          <p>{address(customer.shipping_address)}</p>
          <p>{item.note}</p>
        </div>
        <div>
          <h3 className="font-bold mb-3">{t("$.payment.title", locale)}</h3>
          <p>{item.payment?.label || item.payment?.type}</p>
          <p>{item.currency}</p>
        </div>
        <div>
          <h3 className="font-bold mb-3">{t("$.shipping.title", locale)}</h3>
          <p>{item.shipping?.label || item.shipping?.type}</p>
          <p>{money(item.shipping?.price, locale)}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "$.form.name",
                "SKU",
                "$.form.quantity",
                "$.form.price",
                "$.order.total_price",
              ].map((key) => (
                <th key={key}>{t(key, locale)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(item.order_items || item.items || []).map(
              (line: any, index: number) => (
                <tr key={index}>
                  <td>{line.product_name || line.name}</td>
                  <td>{line.sku}</td>
                  <td>{line.quantity}</td>
                  <td>{money(line.price, locale)}</td>
                  <td>{money(line.total_price, locale)}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xl font-bold">
        {t("$.order.total_price", locale)}:{" "}
        {money(item.total_price_all_with_vat ?? item.total_price, locale)}
      </p>
      <a className="btn outline" href={url("/admin/order", locale)}>
        ← {t("$.btn.back", locale)}
      </a>
    </article>
  );
}
