import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || 'https://t.me/city_of_masters_support';

interface Stats {
  fullName: string | null;
  phone: string | null;
  isOnShift: boolean;
  completedOrders: number;
  activeOrder: { id: number; address: string; status: string } | null;
}

function App() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+996 ');
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const tgUser = WebApp.initDataUnsafe?.user;

  const isFullNameValid = fullName.trim().length >= 3;
  const isPhoneValid = /^\+996 \d{3} \d{3} \d{3}$/.test(phone);
  const canSubmit = isFullNameValid && isPhoneValid;

  const fullNameError = fullNameTouched && !isFullNameValid
    ? 'Введите ФИО (минимум 3 символа)' : '';
  const phoneError = phoneTouched && !isPhoneValid
    ? 'Введите номер: +996 XXX XXX XXX' : '';

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      if (WebApp.colorScheme) {
        document.documentElement.setAttribute('data-theme', WebApp.colorScheme);
      }
    } catch {}
  }, []);

  const fetchStats = async (telegramId: string) => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/specialists/my-stats?telegramId=${telegramId}`);
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const local = (digits.startsWith('996') ? digits.slice(3) : digits).slice(0, 9);
    if (local.length === 0) return '+996 ';
    if (local.length <= 3) return `+996 ${local}`;
    if (local.length <= 6) return `+996 ${local.slice(0, 3)} ${local.slice(3)}`;
    return `+996 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  };

  const handleSubmit = async () => {
    setFullNameTouched(true);
    setPhoneTouched(true);
    if (!canSubmit) return;

    const telegramId = tgUser?.id ? String(tgUser.id) : null;
    if (!telegramId) {
      WebApp.showAlert('Не удалось получить Telegram ID. Откройте приложение через бота.');
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${API_URL}/specialists/register-profile`, {
        telegramId,
        fullName: fullName.trim(),
        phone,
      });
      await fetchStats(telegramId);
      setDone(true);
    } catch (err) {
      console.error(err);
      WebApp.showAlert('Ошибка при сохранении. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // ── Dashboard / Analytics screen ──────────────────────────────────────────
  if (done) {
    const displayName = stats?.fullName ?? fullName.trim();
    const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div className="app">
        <div className="content" style={{ animation: 'fadeIn 0.4s ease', paddingBottom: 140 }}>

          {/* Success banner */}
          <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '18px', padding: '20px', marginBottom: '20px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>Профиль заполнен!</div>
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>Теперь вы можете принимать заказы</div>
          </div>

          {/* Profile card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials || '👷'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {stats?.phone ?? phone}
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.12)', color: 'var(--success)', flexShrink: 0 }}>
              Активен
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              {statsLoading
                ? <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>...</div>
                : <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{stats?.completedOrders ?? 0}</div>
              }
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Выполнено заказов</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: stats?.activeOrder ? '#f59e0b' : 'var(--text-secondary)' }}>
                {stats?.activeOrder ? '1' : '0'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>В работе</div>
            </div>
          </div>

          {/* Active order */}
          {stats?.activeOrder && (
            <div className="card" style={{ borderLeft: '3px solid #f59e0b', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Текущий заказ #{stats.activeOrder.id}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)' }}>{stats.activeOrder.address}</div>
            </div>
          )}

          {/* Info tip */}
          <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Включите смену в боте — и заказы начнут поступать автоматически.
            </div>
          </div>

        </div>

        {/* Footer — two action buttons */}
        <div className="footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => WebApp.openLink(SUPPORT_URL)}
          >
            🎧 Поддержка 24/7
          </button>
          <button
            className="btn"
            onClick={() => WebApp.close()}
          >
            Получить заказ →
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="content" style={{ animation: 'fadeIn 0.3s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👷</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
            Регистрация мастера
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Нам нужны только ваше ФИО и номер телефона
          </div>
        </div>

        {/* Full name */}
        <div className="form-group">
          <label className="label">
            ФИО <span className="required">*</span>
          </label>
          <input
            className={`input ${fullNameError ? 'error' : fullNameTouched && isFullNameValid ? 'success' : ''}`}
            value={fullName}
            onChange={e => { setFullName(e.target.value); setFullNameTouched(true); }}
            onBlur={() => setFullNameTouched(true)}
            placeholder="Иванов Иван Иванович"
          />
          {fullNameError
            ? <div className="hint error-text">⚠ {fullNameError}</div>
            : <div className="hint">Это имя будет отображаться у клиента при назначении мастера</div>
          }
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="label">
            Номер телефона <span className="required">*</span>
          </label>
          <input
            className={`input ${phoneError ? 'error' : phoneTouched && isPhoneValid ? 'success' : ''}`}
            value={phone}
            inputMode="tel"
            onChange={e => { setPhone(formatPhone(e.target.value)); setPhoneTouched(true); }}
            onBlur={() => setPhoneTouched(true)}
            placeholder="+996 555 123 456"
          />
          {phoneError
            ? <div className="hint error-text">⚠ {phoneError}</div>
            : <div className="hint">Формат: +996 555 123 456</div>
          }
        </div>

        {/* Info card */}
        <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            После заполнения профиля вы сможете принимать заказы от клиентов прямо в боте.
          </div>
        </div>

      </div>

      {/* Footer button */}
      <div className="footer">
        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><span className="spinner" /> Сохраняем...</>
            : 'Сохранить и начать работу'
          }
        </button>
      </div>
    </div>
  );
}

export default App;
