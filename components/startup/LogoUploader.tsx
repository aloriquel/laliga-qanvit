"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import StartupAvatar from "@/components/ui/StartupAvatar";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = "image/png,image/jpeg,image/webp,image/svg+xml";

type Props = {
  currentLogoUrl: string | null;
  startupName: string;
  onUploaded: (newUrl: string) => void;
  onRemoved: () => void;
};

export default function LogoUploader({
  currentLogoUrl,
  startupName,
  onUploaded,
  onRemoved,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function uploadFile(file: File) {
    // Client-side size guard
    if (file.size > MAX_BYTES) {
      showToast("Imagen demasiado grande. Máximo 2MB.", false);
      return;
    }

    // Immediate preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/startup/logo/upload", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        setPreview(currentLogoUrl); // revert preview on error
        showToast(json.error ?? "Error al subir el logo.", false);
        return;
      }

      onUploaded(json.logo_url);
      setPreview(json.logo_url);
      showToast("Logo actualizado correctamente.", true);
    } catch {
      setPreview(currentLogoUrl);
      showToast("Error de red. Inténtalo de nuevo.", false);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete() {
    setConfirmDelete(false);
    setUploading(true);
    try {
      const res = await fetch("/api/startup/logo/delete", { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        showToast(json.error ?? "Error al eliminar el logo.", false);
        return;
      }
      setPreview(null);
      onRemoved();
      showToast("Logo eliminado.", true);
    } catch {
      showToast("Error de red.", false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {preview ? (
        // ── Has logo: preview + actions ──────────────────────────────────────
        <div className="flex items-center gap-5">
          <StartupAvatar
            startup={{ name: startupName, logo_url: preview }}
            size="lg"
            style={{ border: "2px solid #e5d8ea" }}
          />
          <div className="flex flex-col gap-2">
            <button
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 font-body text-sm bg-brand-navy text-white rounded-xl px-4 py-2 hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Cambiar logo
            </button>

            {!confirmDelete ? (
              <button
                disabled={uploading}
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 font-body text-sm text-ink-secondary border border-border-soft rounded-xl px-4 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Eliminar logo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="font-body text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  Confirmar eliminación
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── No logo: dropzone ─────────────────────────────────────────────────
        <div
          ref={dropRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative w-48 h-48 border-2 border-dashed border-border-soft rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-salmon hover:bg-brand-lavender/30 transition-colors ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <Loader2 size={32} className="animate-spin text-brand-salmon" />
          ) : (
            <>
              <Upload size={28} className="text-ink-secondary" />
              <span className="font-body text-xs text-ink-secondary text-center px-4">
                Arrastra tu logo aquí<br />o haz click para subir
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Copy */}
      <p className="font-body text-xs text-ink-secondary max-w-xs">
        Recomendado: PNG cuadrado 512×512, fondo claro o transparente. Se mostrará en el leaderboard, cartas y perfil público.{" "}
        <span className="text-ink-secondary/70">Si subes un formato no cuadrado, se centrará y rellenará automáticamente.</span>
      </p>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-body text-sm shadow-lg z-50 transition-opacity ${
            toast.ok
              ? "bg-green-700 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
