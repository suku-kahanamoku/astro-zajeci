import { useState } from "react";
import { api } from "../CoreModule/api";
import { fileUrl } from "../CoreModule/objects";
import { t } from "../LangModule";
import type { RecordData } from "../CoreModule/types";
import { useHydrated } from "../UIModule/useHydrated";
export async function attachFiles(
  files: File[],
  item: RecordData,
  onProgress?: (text: string) => void,
) {
  const ids = (
    item.file_ids ||
    item.files?.map((file: any) => file.id) ||
    []
  ).map(Number);
  for (const file of files) {
    onProgress?.(file.name + "…");
    const form = new FormData();
    form.set("file", file);
    const uploaded = await api("/api/files/upload", "POST", form);
    const committed = await api("/api/files/commit", "POST", {
      path: uploaded.data.path,
      name: file.name,
      visibility: Number(item.published) === 1 ? "public" : "private",
      entity_type: "product",
      entity_id: item.id,
    });
    ids.push(Number(committed.data.id));
    // Persist each association before continuing, so a later upload failure cannot orphan earlier files.
    await api("/api/admin/wine/" + item.id, "PATCH", { file_ids: ids });
  }
}
export function FilePicker({
  onChange,
  locale = "cs",
}: {
  onChange: (files: File[]) => void;
  locale?: string;
}) {
  const ready = useHydrated();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  function choose(input: File[]) {
    setError("");
    if (
      input.some(
        (file) =>
          file.size > 20 * 1024 * 1024 ||
          ![
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
          ].includes(file.type),
      )
    ) {
      setError(
        t("$.dropzone.max_file_size", locale, { size: 20 }) +
          " · JPG, PNG, GIF, WEBP, PDF",
      );
      return;
    }
    const next = [...files, ...input];
    setFiles(next);
    onChange(next);
  }
  return (
    <div className="space-y-3">
      <label
        className="block border-2 border-dashed border-primary-200 rounded-xl p-8 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          choose(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="block mb-3">{t("$.dropzone.drag_files", locale)}</span>
        <input
          disabled={!ready}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={(event) => choose(Array.from(event.target.files || []))}
        />
        <span className="block mt-2 text-xs text-gray-500">
          {t("$.dropzone.max_file_size", locale, { size: 20 })}
        </span>
      </label>
      {files.map((file, index) => (
        <div key={index} className="flex justify-between gap-3">
          <span>
            {file.name} ({Math.round(file.size / 1024)} kB)
          </span>
          <button
            type="button"
            aria-label={t("$.btn.delete", locale)}
            onClick={() => {
              const next = files.filter((_, i) => i !== index);
              setFiles(next);
              onChange(next);
            }}
          >
            ×
          </button>
        </div>
      ))}
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Files({
  item,
  locale = "cs",
  onRefresh,
}: {
  item: RecordData;
  locale?: string;
  onRefresh: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);
  return (
    <section className="panel space-y-5">
      <h2 className="text-xl font-bold">{t("$.form.files", locale)}</h2>
      <FilePicker key={key} onChange={setFiles} locale={locale} />
      <button
        className="btn"
        disabled={!files.length || !!progress}
        onClick={async () => {
          setError("");
          try {
            await attachFiles(files, item, setProgress);
            setFiles([]);
            setKey(key + 1);
            onRefresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setProgress("");
          }
        }}
      >
        {progress || t("$.btn.submit", locale)}
      </button>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {item.files?.map((file: any) => (
          <a
            key={file.id}
            href={fileUrl(file.path)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {file.mime_type?.startsWith("image/") ? (
              <img
                src={fileUrl(file.path)}
                alt={file.name}
                className="w-full h-32 object-cover"
              />
            ) : (
              <div className="h-32 grid place-items-center">PDF</div>
            )}
            <span className="block text-xs p-2 truncate">{file.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
