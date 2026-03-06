import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+996 ');
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      setDone(true);
      setTimeout(() => WebApp.close(), 1800);
    } catch (err) {
      console.error(err);
      WebApp.showAlert('Ошибка при сохранении. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="app">
        <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
            Профиль заполнен!
          </div>
          <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Теперь вы можете принимать заказы.<br />Возвращаемся в бот...
          </div>
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
