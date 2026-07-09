import React, { useState, useEffect, useRef } from "react";
import { Card, Button } from "@takt/design-system";
import { Play, Square, Timer } from "lucide-react";
import { api, Category, Activity } from "../services/api";
import { ActivityFormModal } from "./ActivityFormModal";
import { toLocalDateStr, formatHourString } from "../utils/dates";

interface StopwatchPanelProps {
  categories: Category[];
  onActivityLogged: (activity: Activity) => void;
  onSessionChange?: (
    session: {
      categoryName: string;
      categoryColor: string;
      startTime: Date;
    } | null,
  ) => void;
}

export const StopwatchPanel: React.FC<StopwatchPanelProps> = ({
  categories,
  onActivityLogged,
  onSessionChange,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    const start = new Date();
    setIsRunning(true);
    setSessionStartTime(start);
    setTime(0);

    if (cat) {
      onSessionChange?.({
        categoryName: cat.name,
        categoryColor: cat.color,
        startTime: start,
      });
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setSessionEndTime(new Date());
    setShowModal(true);
    onSessionChange?.(null);
  };

  const resetState = () => {
    setTime(0);
    setShowModal(false);
    setSessionStartTime(null);
    setSessionEndTime(null);
  };

  const handleDismissModal = async () => {
    if (!sessionStartTime || !sessionEndTime) return;

    const selectedCategory =
      categories.find((c) => c.id === selectedCategoryId) || categories[0];
    const autoTitle = `Sessao: ${selectedCategory.name}`;

    try {
      const newActivity = await api.createActivity({
        title: autoTitle,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryColor: selectedCategory.color,
        startTime: sessionStartTime.toISOString(),
        endTime: sessionEndTime.toISOString(),
        productivityLevel: 3,
      });

      onActivityLogged(newActivity);
      resetState();
    } catch (err) {
      console.error("Failed to auto-save activity on dismiss", err);
      resetState();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <>
      <Card
        style={{
          marginBottom: 0,
          border: isRunning
            ? "1px solid var(--color-primary)"
            : "1px solid var(--border-color)",
          background: "var(--surface-elevated)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Timer
            size={20}
            style={{
              color: isRunning
                ? "var(--color-primary)"
                : "var(--text-secondary)",
            }}
          />
          Timer em Tempo Real
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="stopwatch-category-select"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Categoria da sessão
            </label>
            <select
              id="stopwatch-category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={isRunning}
              style={{
                fontFamily: "var(--font-family)",
                fontSize: "15px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--border-radius-md)",
                color: "var(--text-primary)",
                padding: "12px 16px",
                paddingRight: "38px",
                width: "100%",
                outline: "none",
                appearance: "none",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237a6a5a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              padding: "16px",
              background: "var(--bg-input)",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--border-color)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              {formatTime(time)
                .split(":")
                .map((part, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: "58px",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      background: "var(--surface-soft)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "22px",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        color: isRunning
                          ? "var(--color-primary)"
                          : "var(--text-primary)",
                      }}
                    >
                      {part}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      {idx === 0 ? "hora" : idx === 1 ? "min" : "seg"}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
              {!isRunning ? (
                <Button
                  id="btn-timer-start"
                  onClick={handleStart}
                  variant="primary"
                >
                  <Play size={16} /> Iniciar
                </Button>
              ) : (
                <Button
                  id="btn-timer-stop"
                  onClick={handleStop}
                  variant="danger"
                >
                  <Square size={16} /> Parar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {sessionStartTime && sessionEndTime && (
        <ActivityFormModal
          open={showModal}
          title="Como foi sua produtividade?"
          categories={categories}
          dateStr={toLocalDateStr(sessionStartTime)}
          lockTimes
          initialValues={{
            categoryId: selectedCategoryId,
            startTime: formatHourString(sessionStartTime.toISOString()),
            endTime: formatHourString(sessionEndTime.toISOString()),
            productivityLevel: 3,
            note: "",
          }}
          submitLabel="Confirmar e Salvar"
          onSubmit={async (values) => {
            const cat =
              categories.find((c) => c.id === values.categoryId) ||
              categories[0];
            const newActivity = await api.createActivity({
              title: `Sessao: ${cat.name}`,
              categoryId: cat.id,
              categoryName: cat.name,
              categoryColor: cat.color,
              startTime: sessionStartTime.toISOString(),
              endTime: sessionEndTime.toISOString(),
              productivityLevel: values.productivityLevel,
              note: values.note.trim() || undefined,
            });
            onActivityLogged(newActivity);
            resetState();
          }}
          onClose={handleDismissModal}
          secondaryAction={{
            label: "Pular & Salvar",
            onClick: handleDismissModal,
          }}
        />
      )}
    </>
  );
};
