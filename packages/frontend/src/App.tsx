import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@takt/design-system';
import { LogOut, Clock, Calendar, Timer, Sparkles, FolderPlus, Trash2, Plus, AlertCircle } from 'lucide-react';
import { api, Category, Activity, User } from './services/api';
import { StopwatchPanel } from './components/StopwatchPanel';
import { CalendarView } from './components/CalendarView';
import '@takt/design-system/theme.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // View management
  const [activeTab, setActiveTab] = useState<'calendar' | 'stopwatch'>('calendar');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Category Inputs
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [catError, setCatError] = useState('');

  useEffect(() => {
    const loggedUser = api.getCurrentUser();
    if (loggedUser) {
      setUser(loggedUser);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      const acts = await api.getActivities();
      setActivities(acts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Email e senha são obrigatórios.');
      return;
    }

    try {
      const data = await api.login(email.trim(), password.trim());
      setUser(data.user);
      loadDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'Falha na autenticação. Verifique os dados.');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCategories([]);
    setActivities([]);
    setEmail('');
    setPassword('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');

    if (!newCatName.trim()) {
      setCatError('O nome da categoria é obrigatório.');
      return;
    }

    if (newCatName.trim().length > 50) {
      setCatError('O nome da categoria deve ter no máximo 50 caracteres.');
      return;
    }

    try {
      const created = await api.createCategory(newCatName.trim(), newCatColor);
      setCategories([...categories, created]);
      setNewCatName('');
    } catch (err: any) {
      setCatError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      // Re-load activities or filter them to reflect deleted categories if required
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  const handleActivityLogged = (newActivity: Activity) => {
    setActivities((prev) => [...prev, newActivity]);
  };

  const handleActivityDeleted = async (id: string) => {
    try {
      await api.deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete activity', err);
    }
  };

  // If not logged in, render Login Page
  if (!user) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, rgb(4, 8, 20) 0%, rgb(11, 15, 29) 100%)',
        padding: '20px'
      }}>
        <Card style={{ width: '100%', maxWidth: '420px', padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px var(--color-primary-glow)',
              animation: 'pulseGlow 2s infinite'
            }}>
              <Clock size={32} style={{ color: 'var(--bg-main)' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Takt App
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Time Tracking e Produtividade Simplificados
            </p>
          </div>

          {authError && (
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-nada)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--color-nada)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              id="login-email-input"
              label="E-mail profissional"
              placeholder="seu-email@empresa.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password-input"
              label="Senha de acesso"
              placeholder="Digite sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} /> Lembrar de mim
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Recuperação via e-mail em desenvolvimento. Por favor faça login direto.'); }} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Esqueceu a senha?</a>
            </div>

            <Button id="btn-login-submit" type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }}>
              Entrar no Takt
            </Button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Não tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); alert('Fluxo de cadastro de conta está ativo pelo formulário de Login. Qualquer credencial válida com senha de 4 dígitos ou mais será criada offline automaticamente!'); }} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se</a>
          </div>
        </Card>
      </main>
    );
  }

  // If logged in, render main application Dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Premium Navbar */}
      <header style={{
        background: 'var(--bg-card)',
        backdropFilter: 'var(--backdrop-blur)',
        WebkitBackdropFilter: 'var(--backdrop-blur)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--color-primary-glow)'
          }}>
            <Clock size={20} style={{ color: 'var(--bg-main)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Takt App</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fase 1: MVP Core Rastreamento</span>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <nav style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'calendar' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'calendar' ? 'var(--bg-main)' : 'var(--text-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Calendar size={14} /> Calendário
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'stopwatch' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'stopwatch' ? 'var(--bg-main)' : 'var(--text-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Timer size={14} /> Cronômetro
          </button>
        </nav>

        {/* User profile details and log out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.role} ({user.level})</div>
          </div>
          
          <Button onClick={handleLogout} variant="ghost" style={{ padding: '8px 12px', border: '1px solid var(--border-color)' }}>
            <LogOut size={16} /> Sair
          </Button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
          
          {/* Left Sidebar: Category Manager and active profile info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Profile Summary */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                Metas Semanais
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Meta de Horas:</span>
                  <span style={{ fontWeight: 600 }}>{user.weeklyTargetHours}h / semana</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Logado como:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{user.email}</span>
                </div>
              </div>
            </Card>

            {/* Categories Customization Section (Interação 1) */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={16} style={{ color: 'var(--color-primary)' }} />
                Gerenciar Categorias
              </h3>

              {catError && (
                <div style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-nada)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-nada)', fontSize: '12px', marginBottom: '12px' }}>
                  {catError}
                </div>
              )}

              {/* Form to create a custom category */}
              <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <Input
                  id="category-name-input"
                  placeholder="Nome (max 50 chars)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value.slice(0, 50))}
                />
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label htmlFor="category-color-input" style={{ fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>Cor:</label>
                  <input
                    id="category-color-input"
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '40px',
                      height: '30px',
                    }}
                  />
                  <Button id="btn-add-category" type="submit" variant="secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                    <Plus size={14} /> Adicionar
                  </Button>
                </div>
              </form>

              {/* List of categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }} className="custom-scroll">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    {cat.isCustom ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remover categoria"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px' }}>
                        Padrão
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Pane: Swaps between Calendar and Stopwatch based on Tab */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeTab === 'stopwatch' ? (
              <StopwatchPanel
                categories={categories}
                onActivityLogged={handleActivityLogged}
              />
            ) : (
              <CalendarView
                categories={categories}
                activities={activities}
                onActivityLogged={handleActivityLogged}
                onActivityDeleted={handleActivityDeleted}
              />
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
