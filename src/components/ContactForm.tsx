import { useState } from "react";
import { api } from "../modules/CoreModule/api";
import { t } from "../modules/LangModule";
import Form from "../modules/UIModule/Form";
import contact from "../config/contact.json";
export default function ContactForm({ locale = "cs" }: { locale?: string }) {
  const [sent, setSent] = useState(false);
  const [revision, setRevision] = useState(0);
  return (
    <div className="contact-form-card">
      <Form
        key={revision}
        columns={1}
        fields={contact.fields}
        locale={locale}
        onSubmit={async (body) => {
          await api("/api/email/contact", "POST", body);
          setSent(true);
          setRevision((value) => value + 1);
        }}
      />
      {sent && (
        <p role="status" className="alert mt-4">
          {t("$.contact.success_msg", locale)}
        </p>
      )}
    </div>
  );
}
