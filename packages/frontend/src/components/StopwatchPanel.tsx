import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, ProductivityLevel, ProductivityBadge } from '@takt/design-system';
import { Play, Square, Timer, AlertCircle, X } from 'lucide-react';
import { api, Category, Activity } from '../services/api';

interface StopwatchPanelProps {
  categories: Category[];
  onActivityLogged: (activity: Activity) => void;
}

export const StopwatchPanel: React.FC<StopwatchPanelProps> = ({
  categories,
  onActivityLogged,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [error, setError] = useState('');
  
  // Post-stop Logging Modal
  const [showModal, setShowModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [prodLevel, setProdLevel] = useState<ProductivityLevel>(3);
  const [note, setNote] = useState('');
  const [modalError, setModalError] = useState('');

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!title.trim()) {
      setError('Por favor, informe o título da atividade antes de começar.');
      return;
    }
    setError('');
    setIsRunning(true);
    setSessionStartTime(new Date());
    setTime(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setSessionEndTime(new Date());
    setShowModal(true);
  };

  const handleSaveActivity = async () => {
    if (!sessionStartTime || !sessionEndTime) return;
    
    if (note.length > 500) {
      setModalError('A justificativa deve ter no máximo 500 caracteres.');
      return;
    }

    const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

    try {
      const newActivity = await api.createActivity({
        title: title.trim(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryColor: selectedCategory.color,
        startTime: sessionStartTime.toISOString(),
        endTime: sessionEndTime.toISOString(),
        productivityLevel: prodLevel,
        note: note.trim() || undefined,
      });

      onActivityLogged(newActivity);
      resetState();
    } catch (err: any) {
      setModalError(err.message || 'Erro ao registrar atividade.');
    }
  };

  const handleDismissModal = async () => {
    // If they click 'X', we still log the activity using default settings as requested:
    // "Se ficar obrigatório a pessoa pode ficar com preguiça... So colocar um botao de x"
    // So click 'X' dismisses the feedback popup and saves it with default level (3) and empty note.
    if (!sessionStartTime || !sessionEndTime) return;
    
    const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
    
    try {
      const newActivity = await api.createActivity({
        title: title.trim(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryColor: selectedCategory.color,
        startTime: sessionStartTime.toISOString(),
        endTime: sessionEndTime.toISOString(),
        productivityLevel: 3, // Default Produtivo
      });

      onActivityLogged(newActivity);
      resetState();
    } catch (err) {
      console.error('Failed to auto-save activity on dismiss', err);
      resetState();
    }
  };

  const resetState = () => {
    setTitle('');
    setTime(0);
    setNote('');
    setProdLevel(3);
    setShowModal(false);
    setSessionStartTime(null);
    setSessionEndTime(null);
    setError('');
    setModalError('');
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <>
      <Card style={{ marginBottom: '24px', border: isRunning ? '1px solid var(--color-primary)' : '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Timer size={20} style={{ color: isRunning ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
          Timer em Tempo Real
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              id="stopwatch-title-input"
              label="O que você está fazendo?"
              placeholder="Digite o título da atividade..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isRunning}
              error={error}
            />

            <div>
              <label htmlFor="stopwatch-category-select" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Categoria
              </label>
              <select
                id="stopwatch-category-select"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={isRunning}
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px', color: isRunning ? 'var(--color-primary)' : 'var(--text-primary)' }}>
              {formatTime(time)}
            </span>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!isRunning ? (
                <Button id="btn-timer-start" onClick={handleStart} variant="primary">
                  <Play size={16} /> Iniciar
                </Button>
              ) : (
                <Button id="btn-timer-stop" onClick={handleStop} variant="danger">
                  <Square size={16} /> Parar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Productivity & Note Dialog (Glassmorphic Modal) */}
      {showModal && (
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
            maxWidth: '500px',
            padding: '24px',
            boxShadow: 'var(--box-shadow-card)',
            position: 'relative'
          }}>
            <button
              id="btn-close-modal"
              onClick={handleDismissModal}
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
              title="Fechar e salvar com padrões"
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Como foi sua produtividade?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Você trabalhou em <strong>{title}</strong> por {formatTime(time)}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Nível de Produtividade
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {([1, 2, 3, 4] as ProductivityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setProdLevel(level)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--border-radius-md)',
                        border: prodLevel === level ? '2px solid var(--border-color-active)' : '1px solid var(--border-color)',
                        background: prodLevel === level ? 'rgba(255,255,255,0.05)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <ProductivityBadge level={level} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="modal-note-input" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Justificativa / Nota (Opcional - máx. 500 caracteres)
                </label>
                <textarea
                  id="modal-note-input"
                  placeholder="Escreva como foi o rendimento ou algum motivo para distrações..."
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={4}
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
                  {modalError && (
                    <span style={{ fontSize: '12px', color: 'var(--color-nada)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {modalError}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button onClick={handleDismissModal} variant="secondary">
                  Pular & Salvar
                </Button>
                <Button id="btn-modal-save" onClick={handleSaveActivity} variant="primary">
                  Confirmar e Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
