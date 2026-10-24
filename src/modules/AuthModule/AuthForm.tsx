import { useState } from "react";
import { api } from "../CoreModule/api";
import Form from "../UIModule/Form";
import { t } from "../LangModule";
import { url } from "../../config/site";
import type { Field } from "../CoreModule/types";
export default function AuthForm({
  mode,
  locale = "cs",
  token = "",
}: {
  mode: string;
  locale?: string;
  token?: string;
}) {
  const [done, setDone] = useState(false);
  const signup = mode === "signup";
  const reset = mode === "reset-password";
  const forgot = mode === "forgot-password";
  const title = reset
    ? locale === "en"
      ? "Set a new password"
      : "Nastavení nového hesla"
    : t(
        signup
          ? "$.signup.title"
          : forgot
            ? "$.forgot_password.title"
            : "$.login.title",
        locale,
      );
  const fields: Field[] = reset
    ? [
        {
          name: "new_password",
          type: "password",
          label: "$.form.new_password",
          required: true,
          minLength: 8,
          autocomplete: "new-password",
        },
        {
          name: "confirm_password",
          type: "password",
          label: "$.signup.confirm_password",
          required: true,
          minLength: 8,
          autocomplete: "new-password",
        },
      ]
    : [
        {
          name: "email",
          type: "email",
          label: "$.form.email",
          required: true,
          autocomplete: "email",
        },
        ...(!forgot
          ? [
              {
                name: "password",
                type: "password",
                label: "$.form.password",
                required: true,
                minLength: signup ? 8 : 5,
                autocomplete: signup ? "new-password" : "current-password",
              },
            ]
          : []),
        ...(signup
          ? [
              {
                name: "confirm_password",
                type: "password",
                label: "$.signup.confirm_password",
                required: true,
                minLength: 8,
                autocomplete: "new-password",
              },
              {
                name: "terms",
                type: "checkbox",
                label: "$.signup.accept_condition",
                required: true,
              },
            ]
          : !forgot
            ? [
                {
                  name: "remember",
                  type: "checkbox",
                  label: "$.login.remember",
                },
              ]
            : []),
      ];
  return (
    <section className="panel w-full max-w-md mx-auto my-10 space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {done ? (
        <>
          <p role="status">
            {reset
              ? locale === "en"
                ? "Your password has been changed. You can now sign in."
                : "Heslo bylo změněno. Nyní se můžete přihlásit."
              : t("$.forgot_password.success_msg", locale)}
          </p>
          <a className="btn" href={url("/login", locale)}>
            {t("$.login.title", locale)}
          </a>
        </>
      ) : (
        <>
          {mode === "login" && (
            <div className="grid grid-cols-2 gap-4">
              <a
                className="btn outline"
                data-testid="login-google"
                href={"/api/login/google?locale=" + locale}
              >
                Google
              </a>
              <a
                className="btn outline"
                data-testid="login-linkedin"
                href={"/api/login/linkedin?locale=" + locale}
              >
                LinkedIn
              </a>
            </div>
          )}
          <Form
            columns={1}
            fields={fields}
            locale={locale}
            submitLabel={title}
            onSubmit={async (body) => {
              if (
                (signup || reset) &&
                body.confirm_password !== (body.password || body.new_password)
              )
                throw new Error(
                  locale === "en"
                    ? "Passwords do not match."
                    : "Zadaná hesla se neshodují.",
                );
              await api(
                mode === "login"
                  ? "/api/login"
                  : signup
                    ? "/api/auth/signup"
                    : reset
                      ? "/api/auth/complete-reset"
                      : "/api/auth/reset-password",
                "POST",
                { ...body, ...(reset ? { token } : {}) },
              );
              if (reset || forgot) setDone(true);
              else location.href = url("/admin", locale);
            }}
          >
            {signup && (
              <a
                href={url("/terms-conditions", locale)}
                className="text-sm text-primary-500 underline"
                data-testid="terms-conditions"
              >
                {t("$.terms.title", locale)}
              </a>
            )}
          </Form>
          {mode === "login" && (
            <a
              data-testid="forgot-password"
              className="block text-sm text-primary-500"
              href={url("/forgot-password", locale)}
            >
              {t("$.forgot_password.title", locale)}
            </a>
          )}
          <p className="text-sm text-gray-500">
            {t(signup ? "$.signup.has_account" : "$.login.no_account", locale)}{" "}
            <a
              className="text-primary-500"
              href={url(signup ? "/login" : "/signup", locale)}
            >
              {t(signup ? "$.login.title" : "$.signup.title", locale)}
            </a>
          </p>
        </>
      )}
    </section>
  );
}
