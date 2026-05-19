"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { AdminTreatmentCategory, AdminTreatmentItem, AdminTreatmentPayload } from "@/src/modules/dashboard/administrador/domain/entities/AdminTreatment";
import styles from "../styles/AdminTreatmentsSection.module.css";

type Props = {
  item?: AdminTreatmentItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: AdminTreatmentPayload) => Promise<void>;
};

const CATEGORY_OPTIONS: Array<{ value: AdminTreatmentCategory; label: string }> = [
  { value: "estetica", label: "Estética facial / corporal" },
  { value: "kinesiologia", label: "Fisioterapia / Kinesiología" },
];

const toCsv = (values: string[]) => values.join(", ");
const toLines = (values: string[]) => values.join("\n");

const parseCsv = (value: string) => value.split(/[;,]+/).map((entry) => entry.trim()).filter(Boolean);
const parseLines = (value: string) => value.split(/[\n]+/).map((entry) => entry.trim()).filter(Boolean);

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("No fue posible leer el archivo."));
  reader.readAsDataURL(file);
});

export default function AdminTreatmentEditorModal({ item, saving, onClose, onSubmit }: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [nombre, setNombre] = useState(item?.nombre || "");
  const [categoria, setCategoria] = useState<AdminTreatmentCategory>(item?.categoria || "estetica");
  const [segmento, setSegmento] = useState(item?.segmento || "");
  const [descripcion, setDescripcion] = useState(item?.descripcion || "");
  const [beneficios, setBeneficios] = useState(toLines(item?.beneficios || []));
  const [tags, setTags] = useState(toCsv(item?.tags || []));
  const [precioDesde, setPrecioDesde] = useState(item?.precioDesde !== null && item?.precioDesde !== undefined ? String(item.precioDesde) : "");
  const [duracion, setDuracion] = useState(item?.duracionMinutos ? String(item.duracionMinutos) : "");
  const [orden, setOrden] = useState(item?.orden ? String(item.orden) : "0");
  const [destacado, setDestacado] = useState(item?.destacado ?? false);
  const [mostrarEnWeb, setMostrarEnWeb] = useState(item?.mostrarEnWeb ?? true);
  const [mostrarEnApp, setMostrarEnApp] = useState(item?.mostrarEnApp ?? true);
  const [disponibleEnClinica, setDisponibleEnClinica] = useState(item?.disponibleEnClinica ?? true);
  const [disponibleADomicilio, setDisponibleADomicilio] = useState(item?.disponibleADomicilio ?? true);
  const [activo, setActivo] = useState(item?.activo ?? true);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [removeImagen, setRemoveImagen] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  const [error, setError] = useState("");

  const currentImage = useMemo(() => (removeImagen ? null : imagenBase64 || item?.imagenUrl || null), [imagenBase64, item?.imagenUrl, removeImagen]);

  const currentVideo = useMemo(() => (removeVideo ? null : videoBase64 || item?.videoUrl || null), [item?.videoUrl, removeVideo, videoBase64]);

  const handlePickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImagenBase64(dataUrl);
      setRemoveImagen(false);
      setImageFileName(file.name);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible leer la imagen.");
    }
  };

  const handlePickVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setVideoBase64(dataUrl);
      setRemoveVideo(false);
      setVideoFileName(file.name);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible leer el video.");
    }
  };

  const submit = async () => {
    if (nombre.trim().length < 2) {
      setError("Ingresa un nombre válido para el servicio.");
      return;
    }

    const parsedPrice = precioDesde.trim() ? Number(precioDesde.replaceAll(",", ".")) : null;
    const parsedDuration = duracion.trim() ? Number(duracion) : null;
    const parsedOrder = orden.trim() ? Number(orden) : null;

    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setError("El precio debe ser un número válido.");
      return;
    }
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration < 0)) {
      setError("La duración debe ser un entero válido.");
      return;
    }
    if (parsedOrder !== null && (!Number.isFinite(parsedOrder) || parsedOrder < 0)) {
      setError("El orden debe ser un entero válido.");
      return;
    }

    setError("");
    try {
      await onSubmit({
        nombre: nombre.trim(),
        categoria,
        segmento: segmento.trim() || null,
        descripcion: descripcion.trim() || null,
        beneficios: parseLines(beneficios),
        tags: parseCsv(tags),
        precioDesde: parsedPrice,
        duracionMinutos: parsedDuration === null ? null : Math.round(parsedDuration),
        destacado,
        mostrarEnWeb,
        mostrarEnApp,
        disponibleEnClinica,
        disponibleADomicilio,
        orden: parsedOrder === null ? null : Math.round(parsedOrder),
        activo,
        imagenBase64,
        removeImagen,
        videoBase64,
        removeVideo,
      });
    } catch {
      // El error visible ya se resuelve en la seccion padre; evitamos rechazo no capturado.
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={`${styles.modalSurface} ${styles.editorModal}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.formHeader}>
          <div>
            <p className={styles.helperText}>{item ? "Editar tratamiento o servicio" : "Nuevo tratamiento o servicio"}</p>
            <h3 className={styles.formTitle}>{item ? item.nombre : "Crear servicio"}</h3>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={saving}>Cerrar</button>
        </div>

        <div className={styles.modalScrollableBody}>
          <div className={styles.formGrid}>
          <label className={`${styles.fieldLabel} ${styles.span3}`}>
            <span>Categoría</span>
            <select className={styles.select} value={categoria} onChange={(event) => setCategoria(event.target.value as AdminTreatmentCategory)}>
              {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className={`${styles.fieldLabel} ${styles.span5}`}>
            <span>Nombre del servicio</span>
            <input className={styles.textInput} value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span4}`}>
            <span>Segmento o subtítulo</span>
            <input className={styles.textInput} value={segmento} onChange={(event) => setSegmento(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span4}`}>
            <span>Precio desde</span>
            <input className={styles.numberInput} inputMode="decimal" value={precioDesde} onChange={(event) => setPrecioDesde(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span4}`}>
            <span>Duración en minutos</span>
            <input className={styles.numberInput} inputMode="numeric" value={duracion} onChange={(event) => setDuracion(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span4}`}>
            <span>Orden visual</span>
            <input className={styles.numberInput} inputMode="numeric" value={orden} onChange={(event) => setOrden(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span6}`}>
            <span>Descripción</span>
            <textarea className={`${styles.textarea} ${styles.editorTextarea}`} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.span6}`}>
            <span>Beneficios, uno por línea</span>
            <textarea className={`${styles.textarea} ${styles.editorTextarea}`} value={beneficios} onChange={(event) => setBeneficios(event.target.value)} />
          </label>

          <label className={`${styles.fieldLabel} ${styles.fullSpan}`}>
            <span>Tags separados por coma</span>
            <input className={styles.textInput} value={tags} onChange={(event) => setTags(event.target.value)} />
          </label>

          <div className={`${styles.fieldLabel} ${styles.span7}`}>
            <span>Imagen principal</span>
            <div className={styles.mediaPreview}>
              {currentImage ? <Image src={currentImage} alt="Vista previa" width={720} height={320} className={styles.previewImage} unoptimized /> : <p className={styles.helperText}>Sin imagen seleccionada</p>}
            </div>
            <div className={styles.mediaActions}>
              <input ref={imageInputRef} type="file" accept="image/*" className={styles.fileInput} onChange={handlePickImage} />
              <button type="button" className={styles.softButton} onClick={() => imageInputRef.current?.click()}>Seleccionar imagen</button>
              <span className={styles.helperText}>{imageFileName || (item?.imagenUrl && !removeImagen ? "Imagen existente" : "Sin imagen")}</span>
              <button type="button" className={styles.ghostButton} onClick={() => { setRemoveImagen(true); setImagenBase64(null); setImageFileName(""); }}>Quitar</button>
            </div>
          </div>

          <div className={`${styles.fieldLabel} ${styles.span5}`}>
            <span>Video promocional</span>
            <div className={styles.videoPreviewCard}>
              {currentVideo ? (
                <video src={currentVideo} controls className={styles.editorVideoPreview}>
                  Tu navegador no soporta reproducción de video.
                </video>
              ) : (
                <p className={styles.helperText}>Sin video seleccionado</p>
              )}
            </div>
            <div className={styles.mediaActions}>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className={styles.fileInput} onChange={handlePickVideo} />
              <button type="button" className={styles.softButton} onClick={() => videoInputRef.current?.click()}>Seleccionar video</button>
              <span className={styles.helperText}>{videoFileName || (currentVideo ? "Video existente" : "Sin video")}</span>
              <button type="button" className={styles.ghostButton} onClick={() => { setRemoveVideo(true); setVideoBase64(null); setVideoFileName(""); }}>Quitar</button>
            </div>
          </div>

          <div className={`${styles.fieldLabel} ${styles.fullSpan}`}>
            <span>Visibilidad y modalidad</span>
            <div className={styles.switchRow}>
              <label className={styles.checkLabel}><input type="checkbox" checked={destacado} onChange={(event) => setDestacado(event.target.checked)} /> Destacado</label>
              <label className={styles.checkLabel}><input type="checkbox" checked={mostrarEnWeb} onChange={(event) => setMostrarEnWeb(event.target.checked)} /> Visible en web</label>
              <label className={styles.checkLabel}><input type="checkbox" checked={mostrarEnApp} onChange={(event) => setMostrarEnApp(event.target.checked)} /> Visible en app</label>
              <label className={styles.checkLabel}><input type="checkbox" checked={disponibleEnClinica} onChange={(event) => setDisponibleEnClinica(event.target.checked)} /> Disponible en clínica</label>
              <label className={styles.checkLabel}><input type="checkbox" checked={disponibleADomicilio} onChange={(event) => setDisponibleADomicilio(event.target.checked)} /> Disponible a domicilio</label>
              <label className={styles.checkLabel}><input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} /> Activo</label>
            </div>
          </div>
        </div>

        {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.actionSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className={styles.actionPrimary} onClick={() => void submit()} disabled={saving}>{saving ? "Guardando..." : item ? "Actualizar servicio" : "Crear servicio"}</button>
        </div>
      </div>
    </div>
  );
}