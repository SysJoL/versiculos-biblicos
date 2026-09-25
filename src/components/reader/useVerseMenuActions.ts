import { useEffect, useState } from "react";
import type { Lang } from "@/lib/domain/types";
import { showToast } from "@/lib/ui/toast";
import {
  FAVORITES_EVENT,
  favoriteKey,
  isFavorite,
  toggleFavorite,
} from "@/lib/ui/favorites";
import {
  buildVerseImageFilename,
  captureVerseBlobById,
  downloadVerseCaptureById,
} from "@/components/verse/DownloadButton";
import { SQUARE_CAPTURE_ID } from "./VerseSquareImage";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // cae al fallback con textarea
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export type VerseMenuLabels = {
  title: string;
  exportImage: string;
  copyImage: string;
  copyVerse: string;
  copyLink: string;
  share: string;
  close: string;
  favorite: string;
  unfavorite: string;
  favAdded: string;
  favRemoved: string;
  imageSaved: string;
  imageFailed: string;
  imageCopied: string;
  imageCopyFailed: string;
  verseCopied: string;
  linkCopied: string;
  linkFailed: string;
  shareFailed: string;
};

function labelsFor(lang: Lang, verseRefLabel: string): VerseMenuLabels {
  return lang === "es"
    ? {
        title: verseRefLabel,
        exportImage: "Exportar imagen",
        copyImage: "Copiar imagen",
        copyVerse: "Copiar versículo",
        copyLink: "Copiar enlace",
        share: "Compartir",
        close: "Cerrar",
        imageSaved: "Imagen descargada.",
        imageFailed: "No se pudo generar la imagen.",
        imageCopied: "Imagen copiada al portapapeles.",
        imageCopyFailed: "No se pudo copiar la imagen.",
        verseCopied: "Versículo copiado.",
        linkCopied: "Enlace copiado",
        linkFailed: "No se pudo copiar.",
        shareFailed: "No se pudo compartir.",
        favorite: "Guardar en favoritos",
        unfavorite: "Quitar de favoritos",
        favAdded: "Guardado en favoritos.",
        favRemoved: "Quitado de favoritos.",
      }
    : {
        title: verseRefLabel,
        exportImage: "Export image",
        copyImage: "Copy image",
        copyVerse: "Copy verse",
        copyLink: "Copy link",
        share: "Share",
        close: "Close",
        imageSaved: "Image saved.",
        imageFailed: "Could not generate image.",
        imageCopied: "Image copied to clipboard.",
        imageCopyFailed: "Could not copy image.",
        verseCopied: "Verse copied.",
        linkCopied: "Link copied",
        linkFailed: "Could not copy.",
        shareFailed: "Could not share.",
        favorite: "Save to favorites",
        unfavorite: "Remove from favorites",
        favAdded: "Saved to favorites.",
        favRemoved: "Removed from favorites.",
      };
}

type Args = {
  lang: Lang;
  verseRefLabel: string;
  verseText: string;
  verseUrl: string;
  onClose: () => void;
};

/**
 * Lógica compartida del menú del versículo (popover en PC, sheet en móvil):
 * exportar PNG cuadrado, copiar imagen/texto/enlace y compartir.
 */
export function useVerseMenuActions({
  lang,
  verseRefLabel,
  verseText,
  verseUrl,
  onClose,
}: Args) {
  const [busy, setBusy] = useState(false);
  const [canCopyImage, setCanCopyImage] = useState(false);
  const favKey = favoriteKey(lang, verseRefLabel);
  const [isFav, setIsFav] = useState(() => isFavorite(favKey));

  // Re-sincroniza si cambia el versículo o si otra vista modificó favoritos.
  useEffect(() => {
    setIsFav(isFavorite(favoriteKey(lang, verseRefLabel)));
    const sync = () => setIsFav(isFavorite(favoriteKey(lang, verseRefLabel)));
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [lang, verseRefLabel]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      navigator.clipboard &&
      typeof window.ClipboardItem !== "undefined"
    ) {
      setCanCopyImage(true);
    }
  }, []);

  const t = labelsFor(lang, verseRefLabel);
  const shareText = `“${verseText}” — ${verseRefLabel}`;

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await downloadVerseCaptureById(
        SQUARE_CAPTURE_ID,
        buildVerseImageFilename(verseRefLabel)
      );
      showToast(ok ? t.imageSaved : t.imageFailed, ok ? "success" : "error", 2200);
      if (ok) onClose();
    } catch {
      showToast(t.imageFailed, "error");
    } finally {
      setBusy(false);
    }
  };

  const onCopyImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureVerseBlobById(SQUARE_CAPTURE_ID);
      if (!blob) {
        showToast(t.imageFailed, "error");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      showToast(t.imageCopied, "success", 2200);
      onClose();
    } catch (err) {
      console.warn("Failed to copy verse image:", err);
      showToast(t.imageCopyFailed, "error");
    } finally {
      setBusy(false);
    }
  };

  const onCopyVerse = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await copyText(shareText);
      showToast(ok ? t.verseCopied : t.linkFailed, ok ? "success" : "error", 2200);
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await copyText(verseUrl);
      showToast(ok ? t.linkCopied : t.linkFailed, ok ? "success" : "error", 1600);
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  const onToggleFavorite = () => {
    if (busy) return;
    const added = toggleFavorite({
      key: favKey,
      ref: verseRefLabel,
      text: verseText,
      lang,
      url: verseUrl,
    });
    setIsFav(added);
    showToast(added ? t.favAdded : t.favRemoved, "success", 2000);
  };

  const onShare = async () => {    if (busy) return;
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: "BVerses", text: shareText, url: verseUrl });
        onClose();
      } else {
        const ok = await copyText(`${shareText} ${verseUrl}`);
        showToast(ok ? t.linkCopied : t.shareFailed, ok ? "success" : "error", 2200);
        if (ok) onClose();
      }
    } catch (err) {
      // AbortError = el usuario canceló el diálogo nativo: no es un error.
      if (err instanceof DOMException && err.name === "AbortError") {
        onClose();
        return;
      }
      showToast(t.shareFailed, "error");
    } finally {
      setBusy(false);
    }
  };

  return {
    t,
    busy,
    canCopyImage,
    isFav,
    onExport,
    onCopyImage,
    onCopyVerse,
    onCopyLink,
    onToggleFavorite,
    onShare,
  };
}
