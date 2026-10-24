import { useEffect, useId, useState } from "react";
import { api } from "../CoreModule/api";
import { get, set } from "../CoreModule/objects";
import { t } from "../LangModule";
import type { Field, RecordData } from "../CoreModule/types";
import { useHydrated } from "./useHydrated";
export function FieldInput({
  field,
  value,
  onChange,
  locale = "cs",
}: {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  locale?: string;
}) {
  const ready = useHydrated();
  const id = useId();
  const [remote, setRemote] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (field.restOptions?.url)
      api(field.restOptions.url)
        .then((result) => {
          if (active) setRemote(Array.isArray(result.data) ? result.data : []);
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
    return () => {
      active = false;
    };
  }, [field.restOptions?.url]);
  const label = t(field.label, locale) || field.name;
  if (field.type === "hidden") return null;
  const options =
    field.options ||
    remote.map((item) => ({
      value: get(item, field.restOptions.value),
      label: get(item, field.restOptions.label),
    }));
  const common = {
    id,
    name: field.name,
    required: !!field.required,
    disabled: !!field.disabled || !ready,
    autoComplete: field.autocomplete,
    minLength: field.minLength,
    maxLength: field.maxLength,
    placeholder: t(field.placeholder, locale),
    "aria-label": label,
  };
  if (field.type === "checkbox")
    return (
      <label htmlFor={id} className="flex items-center gap-3 py-2">
        <input
          {...common}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    );
  return (
    <label
      htmlFor={id}
      className={"field " + (field.type === "textarea" ? "col-span-full" : "")}
    >
      <span>
        {label}
        {field.required ? " *" : ""}
      </span>
      {["select", "radio"].includes(field.type || "") ? (
        <select
          {...common}
          className="input"
          multiple={!!field.multiple}
          value={
            field.multiple ? (value || []).map(String) : String(value ?? "")
          }
          onChange={(e) => {
            const convert = (v: string) =>
              options.find((option: any) => String(option.value) === v)
                ?.value ?? v;
            onChange(
              field.multiple
                ? Array.from(e.target.selectedOptions, (option) =>
                    convert(option.value),
                  )
                : e.target.value === ""
                  ? null
                  : convert(e.target.value),
            );
          }}
        >
          {!field.multiple && (
            <option value="">{t("$.form.select", locale)}</option>
          )}
          {options.map((option: any, index: number) => (
            <option
              key={index}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {t(option.label, locale)}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          {...common}
          rows={field.rows || 4}
          className="input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          {...common}
          className="input"
          type={field.type === "phone" ? "tel" : field.type || "text"}
          step={field.type === "number" ? "any" : undefined}
          min={field.min}
          max={field.max}
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              field.type === "number"
                ? e.target.value === ""
                  ? null
                  : Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}{" "}
      {error && (
        <span role="alert" className="text-red-600 text-xs">
          {error}
        </span>
      )}
    </label>
  );
}
export function initialValues(fields: Field[], item: RecordData = {}) {
  const result = structuredClone(item);
  for (const field of fields)
    if (get(result, field.name) === undefined && field.value !== undefined)
      set(result, field.name, field.value);
  return result;
}
export function Fields({
  fields,
  value,
  onChange,
  locale = "cs",
  columns = 2,
}: {
  fields: Field[];
  value: RecordData;
  onChange: (value: RecordData) => void;
  locale?: string;
  columns?: number;
}) {
  return (
    <div className={"grid gap-4 " + (columns === 2 ? "md:grid-cols-2" : "")}>
      {fields.map((field) => (
        <FieldInput
          key={field.name}
          field={field}
          value={get(value, field.name)}
          locale={locale}
          onChange={(next) => {
            const copy = structuredClone(value);
            set(copy, field.name, next);
            onChange(copy);
          }}
        />
      ))}
    </div>
  );
}
export default function Form({
  fields,
  item = {},
  onSubmit,
  locale = "cs",
  submitLabel,
  cancel,
  children,
  columns = 2,
}: {
  fields: Field[];
  item?: RecordData;
  onSubmit: (body: RecordData) => Promise<void>;
  locale?: string;
  submitLabel?: string;
  cancel?: string;
  children?: React.ReactNode;
  columns?: number;
}) {
  const ready = useHydrated();
  const [value, change] = useState(() => initialValues(fields, item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        setSuccess(false);
        try {
          const body: RecordData = {};
          for (const field of fields)
            if (!field.disabled && get(value, field.name) !== undefined)
              set(body, field.name, get(value, field.name));
          await onSubmit(body);
          setSuccess(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Fields
        columns={columns}
        fields={fields}
        value={value}
        onChange={change}
        locale={locale}
      />
      {children}
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="alert">
          {t("$.message.patch_success_msg", locale)}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          data-testid="form-submit"
          className="btn"
          disabled={busy || !ready}
        >
          {busy ? "…" : submitLabel || t("$.btn.submit", locale)}
        </button>
        {cancel && (
          <a href={cancel} className="btn outline">
            {t("$.btn.cancel", locale)}
          </a>
        )}
      </div>
    </form>
  );
}
