import React, { useState } from 'react';
import { Card, Button, Input, ProductivityLevel, ProductivityBadge } from '@takt/design-system';
import { Calendar, Plus, Clock, FileText, Trash2, X, AlertCircle } from 'lucide-react';
import { api, Category, Activity } from '../services/api';

interface CalendarViewProps {
  categories: Category[];
  activities: Activity[];
  onActivityLogged: (activity: Activity) => void;
  onActivityDeleted: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  categories,
  activities,
  onActivityLogged,
  onActivityDeleted,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('10:00');
  const [prodLevel, setProdLevel] = useState<ProductivityLevel>(3);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Daily hours range for the calendar grid visualization
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

  const handleOpenAddModal = (hour?: number) => {
    if (categories.length === 0) {
      alert('Por favor, crie pelo menos uma categoria primeiro.');
      return;
    }
    setSelectedCategoryId(categories[0].id);
    if (hour !== undefined) {
      const pad = (h: number) => h.toString().padStart(2, '0');
      setStartHour(`${pad(hour)}:00`);
      setEndHour(`${pad(hour + 1)}:00`);
    }
    setTitle('');
    setNote('');
    setProdLevel(3);
    setError('');
    setShowAddModal(true);
  };

  const handleCreateActivity = async () => {
    if (!title.trim()) {
      setError('O título da atividade é obrigatório.');
      return;
    }

    if (note.length > 500) {
      setError('A justificativa deve ter no máximo 500 caracteres.');
      return;
    }

    const startDateTime = new Date(`${dateStr}T${startHour}`);
    const endDateTime = new Date(`${dateStr}T${endHour}`);

    if (endDateTime <= startDateTime) {
      setError('A hora de término deve ser após a hora de início.');
      return;
    }

    const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

    try {
      const newActivity = await api.createActivity({
        title: title.trim(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryColor: selectedCategory.color,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        productivityLevel: prodLevel,
        note: note.trim() || undefined,
      });

      onActivityLogged(newActivity);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar atividade.');
    }
  };

  const getActivitiesForHour = (hour: number) => {
    return activities.filter((act) => {
      const start = new Date(act.startTime);
      const startH = start.getHours();
      const actDateStr = start.toISOString().split('T')[0];
      return actDateStr === dateStr && startH === hour;
    });
  };

  const formatHourString = (isoString: string) => {
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
        {/* Calendar Navigation & Log Input Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
              Calendário de Lançamentos
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="calendar-date-input" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Selecionar Dia
                </label>
                <input
                  id="calendar-date-input"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <Button id="btn-open-log-modal" onClick={() => handleOpenAddModal()} variant="primary" style={{ width: '100%' }}>
                <Plus size={16} /> Lançar Bloco Manual
              </Button>
            </div>
          </Card>

          {/* List of registered activities */}
          <Card style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>Lançados Hoje ({dateStr})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scroll">
              {activities.filter(a => a.startTime.startsWith(dateStr)).length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                  Nenhuma atividade registrada para este dia.
                </p>
              ) : (
                activities
                  .filter(a => a.startTime.startsWith(dateStr))
                  .map((act) => (
                    <div
                      key={act.id}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--border-radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative'
                      }}
                    >
                      <button
                        onClick={() => onActivityDeleted(act.id)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-nada)',
                          cursor: 'pointer',
                          opacity: 0.7,
                        }}
                        title="Deletar atividade"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: act.categoryColor }} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {act.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatHourString(act.startTime)} - {formatHourString(act.endTime)}
                        </span>
                        <span>
                          {act.categoryName}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <ProductivityBadge level={act.productivityLevel} />
                        {act.note && (
                          <div style={{ display: 'flex', alignItems: 'start', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '6px 8px', borderRadius: 'var(--border-radius-sm)', width: '100%', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <FileText size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ wordBreak: 'break-word' }}>{act.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* Interactive Calendar Scheduler Grid */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visualização de Grade Diária</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{dateStr}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
            {hours.map((hour) => {
              const hourActivities = getActivitiesForHour(hour);
              const label = `${hour.toString().padStart(2, '0')}:00`;
              
              return (
                <div
                  key={hour}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    minHeight: '60px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <div style={{
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.15)'
                  }}>
                    {label}
                  </div>

                  <div
                    onClick={() => {
                      if (hourActivities.length === 0) handleOpenAddModal(hour);
                    }}
                    style={{
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: hourActivities.length === 0 ? 'pointer' : 'default',
                      position: 'relative',
                    }}
                    className={hourActivities.length === 0 ? 'grid-slot-empty' : ''}
                  >
                    <style>{`
                      .grid-slot-empty:hover {
                        background: rgba(16, 185, 129, 0.05) !important;
                      }
                    `}</style>

                    {hourActivities.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'none', position: 'absolute', right: '12px', top: '18px' }} className="click-to-add">
                        + Clique para lançar
                      </span>
                    ) : (
                      hourActivities.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--border-radius-sm)',
                            borderLeft: `4px solid ${act.categoryColor}`,
                            background: `${act.categoryColor}15`,
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600 }}>{act.title}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              ({formatHourString(act.startTime)} - {formatHourString(act.endTime)})
                            </span>
                          </div>
                          <ProductivityBadge level={act.productivityLevel} style={{ padding: '2px 6px', fontSize: '10px' }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Retro Creator Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            width: '100%',
            maxWidth: '550px',
            padding: '24px',
            boxShadow: 'var(--box-shadow-card)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Lançar Bloco Retroativo
            </h3>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-nada)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-nada)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                id="retro-activity-title"
                label="Nome da Atividade"
                placeholder="Ex: Refatoração de testes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label htmlFor="retro-category-select" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Categoria
                  </label>
                  <select
                    id="retro-category-select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: '15px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      width: '100%',
                      outline: 'none',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="retro-date" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Data
                  </label>
                  <input
                    id="retro-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: '15px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label htmlFor="retro-start-time" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Hora Início
                  </label>
                  <input
                    id="retro-start-time"
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: '15px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="retro-end-time" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Hora Fim
                  </label>
                  <input
                    id="retro-end-time"
                    type="time"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-family)',
                      fontSize: '15px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Produtividade
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {([1, 2, 3, 4] as ProductivityLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setProdLevel(level)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--border-radius-md)',
                        border: prodLevel === level ? '2px solid var(--border-color-active)' : '1px solid var(--border-color)',
                        background: prodLevel === level ? 'rgba(255,255,255,0.05)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ProductivityBadge level={level} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="retro-note" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Justificativa / Nota (Opcional - máx. 500 caracteres)
                </label>
                <textarea
                  id="retro-note"
                  placeholder="Motivos para seu rendimento..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{
                    fontFamily: 'var(--font-family)',
                    fontSize: '14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {note.length}/500 caracteres
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button onClick={() => setShowAddModal(false)} variant="secondary">
                  Cancelar
                </Button>
                <Button id="btn-save-retro" onClick={handleCreateActivity} variant="primary">
                  Salvar Lançamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
