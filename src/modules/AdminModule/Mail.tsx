import { useState } from "react";
import Form from "../UIModule/Form";
import Modal from "../UIModule/Modal";
import { api } from "../CoreModule/api";
import { t } from "../LangModule";
import config from "./configs/admin-mail-send.json";
export default function Mail({
  templates,
  locale = "cs",
}: {
  templates: any[];
  locale?: string;
}) {
  const [template, setTemplate] = useState("");
  return (
    <div className="panel">
      <table className="data-table">
        <thead>
          <tr>
            <th>{t("$.mail.template", locale)}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {templates.map((item, index) => (
            <tr key={index}>
              <td>{item.template}</td>
              <td>
                <button
                  className="btn outline small"
                  onClick={() => setTemplate(item.template)}
                >
                  {t("$.admin.mail.send", locale)}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {template && (
        <Modal title={template} onClose={() => setTemplate("")}>
          <div className="p-6">
            <Form
              fields={config.fields}
              locale={locale}
              onSubmit={async (body) => {
                await api("/api/admin/mail/send", "POST", {
                  ...body,
                  template,
                });
                setTemplate("");
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
