import React, { useEffect, useRef, useState } from "react";
import { Card, ProductivityBadge } from "@takt/design-system";
import { api, Category, Activity } from "../services/api";
import { ActivityFormModal, ActivityFormValues } from "./ActivityFormModal";
import { toLocalDateStr, formatHourString, minutesOfDay } from "../utils/dates";

const DAY_START = 0;
const DAY_END = 24 * 60;
const PX_PER_MIN = 1.1;
const VISIBLE_HOURS = 9;
const DEFAULT_START_HOUR = 8;

interface CalendarViewProps {
  categories: Category[];
  activities: Activity[];
  onActivityLogged: (activity: Activity) => void;
  onActivityUpdated?: (activity: Activity) => void;
  onActivityDeleted: (id: string) => void;
  dateStr: string;
  retroCategoryId: string;
  openRetroRequest: number;
  activeSession?: {
    categoryName: string;
    categoryColor: string;
    startTime: Date;
  } | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  categories,
  activities,
  onActivityLogged,
  onActivityUpdated,
  onActivityDeleted,
  dateStr,
  retroCategoryId,
  openRetroRequest,
  activeSession,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [initialValues, setInitialValues] = useState<ActivityFormValues | null>(
    null,
  );
  const [now, setNow] = useState(new Date());
  const [timelineHeight, setTimelineHeight] = useState(0);
  const [visibleStartMins, setVisibleStartMins] = useState(
    DEFAULT_START_HOUR * 60,
  );
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const visibleWindowMins = VISIBLE_HOURS * 60;
  const visibleEndMins = visibleStartMins + visibleWindowMins;
  const pxPerMin =
    timelineHeight > 0 ? timelineHeight / visibleWindowMins : PX_PER_MIN;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;

    const updateHeight = () => {
      setTimelineHeight(el.clientHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const minsToTime = (mins: number) =>
    `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

  const openCreateModal = (startMins?: number, forcedCategoryId?: string) => {
    if (categories.length === 0) return;
    const start = startMins ?? 9 * 60;
    setEditingActivity(null);
    setInitialValues({
      categoryId:
        categories.find((c) => c.id === forcedCategoryId)?.id ||
        categories[0].id,
      startTime: minsToTime(start),
      endTime: minsToTime(Math.min(start + 60, DAY_END)),
      productivityLevel: 3,
      note: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setInitialValues({
      categoryId: act.categoryId,
      startTime: formatHourString(act.startTime),
      endTime: formatHourString(act.endTime),
      productivityLevel: act.productivityLevel,
      note: act.note || "",
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (openRetroRequest > 0) openCreateModal(undefined, retroCategoryId);
  }, [openRetroRequest, retroCategoryId]);

  useEffect(() => {
    const isToday = toLocalDateStr(now) === dateStr;
    const currentHour = isToday ? now.getHours() : DEFAULT_START_HOUR;
    const halfWindow = Math.floor(VISIBLE_HOURS / 2);
    const maxStartHour = 24 - VISIBLE_HOURS;
    const startHour = Math.max(
      0,
      Math.min(currentHour - halfWindow, maxStartHour),
    );
    setVisibleStartMins(startHour * 60);
  }, [dateStr, now]);

  const handleSubmit = async (values: ActivityFormValues) => {
    const category =
      categories.find((c) => c.id === values.categoryId) || categories[0];
    const payload = {
      title: `Bloco: ${category.name}`,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      startTime: new Date(`${dateStr}T${values.startTime}`).toISOString(),
      endTime: new Date(`${dateStr}T${values.endTime}`).toISOString(),
      productivityLevel: values.productivityLevel,
      note: values.note.trim() || undefined,
    };

    if (editingActivity) {
      const updated = await api.updateActivity(editingActivity.id, payload);
      onActivityUpdated?.(updated);
    } else {
      const created = await api.createActivity(payload);
      onActivityLogged(created);
    }
  };

  const handleDelete = () => {
    if (!editingActivity) return;
    if (
      window.confirm(
        "Excluir este lançamento? Essa ação não pode ser desfeita.",
      )
    ) {
      onActivityDeleted(editingActivity.id);
      setModalOpen(false);
    }
  };

  const dayActivities = activities.filter(
    (act) => toLocalDateStr(new Date(act.startTime)) === dateStr,
  );

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-activity-block]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mins = visibleStartMins + (e.clientY - rect.top) / pxPerMin;
    const snapped = Math.floor(mins / 30) * 30;
    openCreateModal(Math.max(DAY_START, Math.min(snapped, DAY_END - 30)));
  };

  const blockPosition = (startISO: string, endISO: string) => {
    const start = Math.max(minutesOfDay(startISO), visibleStartMins);
    const end = Math.min(minutesOfDay(endISO), visibleEndMins);
    if (end <= start) return null;

    return {
      top: (start - visibleStartMins) * pxPerMin,
      height: Math.max((end - start) * pxPerMin, 10),
    };
  };

  const isToday = toLocalDateStr(now) === dateStr;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const showNowLine =
    isToday && nowMins >= visibleStartMins && nowMins <= visibleEndMins;

  const hours = Array.from(
    { length: VISIBLE_HOURS },
    (_, i) => Math.floor(visibleStartMins / 60) + i,
  );

  return (
    <>
      <Card
        style={{
          padding: "16px",
          background: "var(--surface-elevated)",
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              Linha do tempo do dia
            </h3>
          </div>
        </div>

        <div
          ref={timelineScrollRef}
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
            overscrollBehavior: "contain",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "52px 1fr",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                borderRight: "1px solid var(--border-color)",
                background: "var(--bg-input)",
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    height: 60 * pxPerMin,
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "4px",
                  }}
                >
                  {pad(h)}:00
                </div>
              ))}
            </div>

            <div
              onClick={handleTimelineClick}
              style={{
                position: "relative",
                height: "100%",
                background: "var(--surface-soft)",
                cursor: "copy",
                backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${60 * pxPerMin - 1}px, var(--border-color) ${60 * pxPerMin - 1}px, var(--border-color) ${60 * pxPerMin}px)`,
              }}
            >
              {dayActivities.map((act) => {
                const pos = blockPosition(act.startTime, act.endTime);
                if (!pos) return null;

                const { top, height } = pos;
                const compact = height < 44;
                return (
                  <button
                    key={act.id}
                    data-activity-block
                    onClick={() => openEditModal(act)}
                    title={`${act.categoryName} · ${formatHourString(act.startTime)}-${formatHourString(act.endTime)}. Toque para editar.`}
                    style={{
                      position: "absolute",
                      top,
                      height,
                      left: "6px",
                      right: "6px",
                      borderRadius: "var(--border-radius-sm)",
                      border: "none",
                      borderLeft: `3px solid ${act.categoryColor}`,
                      background: `color-mix(in srgb, ${act.categoryColor} 14%, var(--surface-elevated))`,
                      color: "var(--text-primary)",
                      padding: compact ? "2px 8px" : "6px 10px",
                      display: "flex",
                      flexDirection: compact ? "row" : "column",
                      alignItems: compact ? "center" : "flex-start",
                      gap: compact ? "8px" : "2px",
                      textAlign: "left",
                      cursor: "pointer",
                      overflow: "hidden",
                      fontFamily: "var(--font-family)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {act.categoryName}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatHourString(act.startTime)}-
                      {formatHourString(act.endTime)}
                    </span>
                    {!compact && (
                      <ProductivityBadge
                        level={act.productivityLevel}
                        style={{
                          marginTop: "auto",
                          fontSize: "10px",
                          padding: "2px 6px",
                        }}
                      />
                    )}
                  </button>
                );
              })}

              {activeSession &&
                isToday &&
                (() => {
                  const { top, height } = blockPosition(
                    activeSession.startTime.toISOString(),
                    now.toISOString(),
                  );
                  return (
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        top,
                        height,
                        left: "6px",
                        right: "6px",
                        borderRadius: "var(--border-radius-sm)",
                        border: `2px dashed ${activeSession.categoryColor}`,
                        background: `color-mix(in srgb, ${activeSession.categoryColor} 8%, transparent)`,
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        pointerEvents: "none",
                        animation: "pulseGlow 2.5s infinite",
                      }}
                    >
                      {activeSession.categoryName} · em andamento
                    </div>
                  );
                })()}

              {showNowLine && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: (nowMins - visibleStartMins) * pxPerMin,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "var(--color-primary)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-4px",
                      top: "-3px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {initialValues && (
        <ActivityFormModal
          open={modalOpen}
          title={editingActivity ? "Editar Lançamento" : "Lançar Bloco"}
          categories={categories}
          dateStr={dateStr}
          initialValues={initialValues}
          submitLabel={
            editingActivity ? "Salvar Alterações" : "Salvar Lançamento"
          }
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
          secondaryAction={
            editingActivity
              ? { label: "Excluir", onClick: handleDelete, variant: "danger" }
              : undefined
          }
        />
      )}
    </>
  );
};
