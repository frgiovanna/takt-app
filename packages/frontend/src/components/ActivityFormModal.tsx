import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  ProductivityLevel,
  ProductivityBadge,
} from "@takt/design-system";
import { X, AlertCircle } from "lucide-react";
import { Category } from "../services/api";

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-family)",
  fontSize: "15px",
  background: "var(--bg-input)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--border-radius-md)",
  color: "var(--text-primary)",
  padding: "12px 16px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: "8px",
};

export interface ActivityFormValues {
  categoryId: string;
  startTime: string;
  endTime: string;
  productivityLevel: ProductivityLevel;
  note: string;
}

interface ActivityFormModalProps {
  open: boolean;
  title: string;
  categories: Category[];
  dateStr: string;
  initialValues: ActivityFormValues;
  lockTimes?: boolean;
  submitLabel?: string;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
  onClose: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "secondary" | "danger";
  };
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  open,
  title,
  categories,
  dateStr,
  initialValues,
  lockTimes = false,
  submitLabel = "Salvar",
  onSubmit,
  onClose,
  secondaryAction,
}) => {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setError("");
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const setField = <K extends keyof ActivityFormValues>(
    key: K,
    value: ActivityFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (values.note.length > 500) {
      setError("A justificativa deve ter no máximo 500 caracteres.");
      return;
    }

    if (!lockTimes) {
      const start = new Date(`${dateStr}T${values.startTime}`);
      const end = new Date(`${dateStr}T${values.endTime}`);
      if (end <= start) {
        setError("A hora de término deve ser após a hora de início.");
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar atividade.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16, 14, 12, 0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-color)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "550px",
          maxHeight: "90dvh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "var(--box-shadow-card)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "10px",
            borderRadius: "50%",
            display: "flex",
          }}
        >
          <X size={20} />
        </button>

        <h3
          style={{
            fontSize: "20px",
            fontWeight: 600,
            margin: "0 0 16px 0",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h3>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px",
              background:
                "color-mix(in srgb, var(--color-nada) 10%, transparent)",
              border: "1px solid var(--color-nada)",
              borderRadius: "var(--border-radius-md)",
              color: "var(--color-nada)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label htmlFor="af-category" style={labelStyle}>
                Categoria
              </label>
              <select
                id="af-category"
                value={values.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                style={{ ...inputStyle, appearance: "none" }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="af-date" style={labelStyle}>
                Data
              </label>
              <input
                id="af-date"
                type="date"
                value={dateStr}
                readOnly
                style={{ ...inputStyle, opacity: 0.7 }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label htmlFor="af-start" style={labelStyle}>
                Hora Início
              </label>
              <input
                id="af-start"
                type="time"
                value={values.startTime}
                readOnly={lockTimes}
                onChange={(e) => setField("startTime", e.target.value)}
                style={{ ...inputStyle, opacity: lockTimes ? 0.7 : 1 }}
              />
            </div>
            <div>
              <label htmlFor="af-end" style={labelStyle}>
                Hora Fim
              </label>
              <input
                id="af-end"
                type="time"
                value={values.endTime}
                readOnly={lockTimes}
                onChange={(e) => setField("endTime", e.target.value)}
                style={{ ...inputStyle, opacity: lockTimes ? 0.7 : 1 }}
              />
            </div>
          </div>

          <div>
            <span style={{ ...labelStyle, marginBottom: "10px" }}>
              Produtividade
            </span>
            <div
              role="radiogroup"
              aria-label="Nível de produtividade"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              {([1, 2, 3, 4] as ProductivityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={values.productivityLevel === level}
                  onClick={() => setField("productivityLevel", level)}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--border-radius-md)",
                    border:
                      values.productivityLevel === level
                        ? "2px solid var(--border-color-active)"
                        : "1px solid var(--border-color)",
                    background:
                      values.productivityLevel === level
                        ? "var(--bg-input)"
                        : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <ProductivityBadge level={level} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="af-note" style={labelStyle}>
              Justificativa / Nota (opcional)
            </label>
            <textarea
              id="af-note"
              placeholder="Motivos para seu rendimento..."
              value={values.note}
              onChange={(e) => setField("note", e.target.value.slice(0, 500))}
              rows={3}
              style={{ ...inputStyle, fontSize: "14px", resize: "vertical" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {values.note.length}/500
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "4px",
              flexWrap: "wrap",
            }}
          >
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || "secondary"}
                style={{ marginRight: "auto" }}
              >
                {secondaryAction.label}
              </Button>
            )}
            <Button onClick={onClose} variant="ghost">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} variant="primary" disabled={saving}>
              {saving ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
