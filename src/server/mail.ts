import { php } from "./php";
import { env } from "./env";
import { SITE_URL } from "../config/site";
export function sendMail(
  template: string,
  to: string,
  subject: string,
  extra: Record<string, any> = {},
  token?: string,
) {
  return php("/mailer/send", {
    method: "POST",
    token,
    body: {
      template,
      to,
      subject,
      fromEmail: env("NUXT_MAILING_FROM", "vyborne@vinozezajeci.cz"),
      fromName: env("NUXT_MAILING_FROM_NAME", "Víno ze Zaječí"),
      fromPhone: env("NUXT_MAILING_FROM_PHONE", "+420770199999"),
      logoPath: SITE_URL + "/img/logo_white.svg",
      ...extra,
    },
  });
}
