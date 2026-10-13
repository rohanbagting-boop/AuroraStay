import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, CalendarCheck, KeyRound, Mail, Phone, ShieldCheck, UserRound, Eye, EyeOff, Check, AlertCircle, ArrowLeft, Clock, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Logo } from '../components/Logo.jsx';

export function PasswordRequirements({ password = '' }) {
  const rules = [
    { id: 'length', label: 'At least 8 characters', valid: password.length >= 8 },
    { id: 'lower', label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { id: 'upper', label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { id: 'number', label: 'One number (0-9)', valid: /[0-9]/.test(password) }
  ];

  const metCount = rules.filter((r) => r.valid).length;

  let strengthClass = '';
  let strengthLabel = 'Requirements';

  if (password.length > 0) {
    if (metCount <= 1) {
      strengthClass = 'strength-weak';
      strengthLabel = 'Weak';
    } else if (metCount === 2) {
      strengthClass = 'strength-fair';
      strengthLabel = 'Fair';
    } else if (metCount === 3) {
      strengthClass = 'strength-good';
      strengthLabel = 'Good';
    } else if (metCount === 4) {
      strengthClass = 'strength-strong';
      strengthLabel = 'Strong & ready';
    }
  }

  const getBarClass = (index) => {
    if (index >= metCount || password.length === 0) return '';
    if (metCount <= 1) return 'fill-weak';
    if (metCount === 2) return 'fill-fair';
    if (metCount === 3) return 'fill-good';
    return 'fill-strong';
  };

  return (
    <div className="passwordValidationBox" aria-live="polite">
      <div className="passwordStrengthHeader">
        <span>Password requirements</span>
        {password.length > 0 && <strong className={strengthClass}>{strengthLabel}</strong>}
      </div>
      <div className="passwordMeter">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className={`passwordMeterBar ${getBarClass(idx)}`} />
        ))}
      </div>
      <ul className="passwordValidationList">
        {rules.map((rule) => (
          <li key={rule.id} className={`passwordValidationItem ${rule.valid ? 'valid' : ''}`}>
            <span className="passwordValidationIcon">
              {rule.valid ? <Check size={11} strokeWidth={3} /> : <span className="passwordValidationBullet" />}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PasswordInput({ placeholder, registerObj }) {
  const [show, setShow] = useState(false);
  return (
    <div className="authField" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <KeyRound size={18} />
      <input placeholder={placeholder} type={show ? 'text' : 'password'} {...registerObj} style={{ width: '100%', paddingRight: '40px' }} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#666' }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm();
  async function submit(values) {
    try {
      const loggedUser = await login(values);
      if (loggedUser?.role === 'admin' || loggedUser?.role === 'receptionist') {
        navigate('/dashboard');
      } else {
        navigate('/account');
      }
    } catch (e) {
      if (e.response?.data?.code === 'REGISTRATION_UNVERIFIED') {
        navigate('/register', {
          state: {
            email: values.email,
            step: 'otp',
            notice: 'Your account registration is pending verification. Please enter the verification code sent to your email.'
          }
        });
        return;
      }
      setError(e.response?.data?.message || 'Incorrect email and password. Please try again.');
    }
  }
  return (
    <AuthForm eyebrow="Guest access" title="Welcome back" subtitle="Sign in to review your reservations, upcoming stays, and account details." onSubmit={handleSubmit(submit)} error={error}>
      <label><span>Email address</span><div className="authField"><Mail size={18} /><input placeholder="you@example.com" {...register('email')} /></div></label>
      <label><span>Password</span><PasswordInput placeholder="Enter your password" registerObj={register('password')} /></label>
      <button className="authSubmit">Sign in <ArrowRight size={18} /></button>
      <div className="authLinks"><Link to="/forgot-password">Forgot password?</Link><Link to="/register">Create an account</Link></div>
    </AuthForm>
  );
}

export function Register() {
  const { requestOtp, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(location.state?.step || 'form'); // 'form' | 'otp'
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [cooldown, setCooldown] = useState(0);
  const [savedEmail, setSavedEmail] = useState(location.state?.email || '');

  const { register, handleSubmit, watch, getValues, setValue } = useForm();
  const password = watch('password') || '';
  const phone = watch('phone') || '';

  useEffect(() => {
    register('phone');
  }, [register]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  async function onFormSubmit(values) {
    const isLengthValid = values.password?.length >= 8;
    const hasLower = /[a-z]/.test(values.password || '');
    const hasUpper = /[A-Z]/.test(values.password || '');
    const hasNumber = /[0-9]/.test(values.password || '');

    if (!isLengthValid || !hasLower || !hasUpper || !hasNumber) {
      setError('Please satisfy all password requirements before continuing.');
      return;
    }

    const cleanPhone = (values.phone || '').trim();
    if (cleanPhone && cleanPhone.length !== 11) {
      setError('Phone number must be exactly 11 digits and contain numbers only.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await requestOtp(values);
      setSavedEmail(values.email);
      setStep('otp');
      setCooldown(res.data?.resendCooldown || 60);
      setRemainingAttempts(res.data?.maxAttempts || 5);
      if (res.data?.developmentOtp) {
        setDevCode(res.data.developmentOtp);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send verification code. Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifySubmit(e) {
    e.preventDefault();
    const cleanOtp = otpValue.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOtp({ email: savedEmail, otp: cleanOtp });
      navigate('/account');
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Verification failed. Please check the code.';
      setError(errorMsg);
      setRemainingAttempts((prev) => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await resendOtp(savedEmail);
      setCooldown(res.data?.resendCooldown || 60);
      setRemainingAttempts(res.data?.maxAttempts || 5);
      if (res.data?.developmentOtp) {
        setDevCode(res.data.developmentOtp);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <AuthForm
        eyebrow="Security verification"
        title="Verify your email"
        subtitle="Enter the 6-digit code sent to your email to verify and complete your guest account."
        onSubmit={onVerifySubmit}
        error={error}
      >
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="otpEmailBadge">
              <Mail size={15} />
              {savedEmail}
            </span>
          </div>

          <div className="otpInputWrapper">
            <input
              type="text"
              className="otpInput"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
            />
          </div>

          <div className="otpMetaRow">
            <span className="otpAttemptsBadge">
              <AlertCircle size={14} />
              {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
            </span>
            <button
              type="button"
              className="otpResendBtn"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
            >
              {cooldown > 0 ? (
                <>
                  <Clock size={14} /> Resend in {cooldown}s
                </>
              ) : (
                <>
                  <RotateCcw size={14} /> Resend code
                </>
              )}
            </button>
          </div>

          {devCode && (
            <div className="otpDevNotice">
              <span>Demo preview code: <strong>{devCode}</strong></span>
              <button
                type="button"
                className="subtleButton"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
                onClick={() => setOtpValue(devCode)}
              >
                Auto-fill
              </button>
            </div>
          )}

          <button className="authSubmit" disabled={loading || otpValue.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & create account'} <ArrowRight size={18} />
          </button>

          <div className="authLinks single">
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError('');
                setNotice('');
                setOtpValue('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.86rem',
                fontWeight: 600,
                padding: '0.4rem 0'
              }}
            >
              <ArrowLeft size={16} /> Edit account details
            </button>
          </div>
        </div>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      eyebrow="New guest profile"
      title="Create your account"
      subtitle="Save your details once, then manage reservations and future stays more easily."
      onSubmit={handleSubmit(onFormSubmit)}
      error={error}
      message={notice}
    >
      <label>
        <span>Full name</span>
        <div className="authField">
          <UserRound size={18} />
          <input placeholder="Your full name" {...register('name')} />
        </div>
      </label>
      <label>
        <span>Email address</span>
        <div className="authField">
          <Mail size={18} />
          <input placeholder="you@example.com" {...register('email')} />
        </div>
      </label>
      <label>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Phone number</span>
          {phone.length > 0 && (
            <small
              style={{
                color: phone.length === 11 ? '#10b981' : '#b45309',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              {phone.length}/11 digits
            </small>
          )}
        </span>
        <div className="authField">
          <Phone size={18} />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="09123456789"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              setValue('phone', digits, { shouldValidate: true });
            }}
            onKeyDown={(e) => {
              if (
                !/^\d$/.test(e.key) &&
                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'].includes(e.key) &&
                !e.ctrlKey &&
                !e.metaKey
              ) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData?.getData('text') || '';
              const digits = pasted.replace(/\D/g, '').slice(0, 11);
              setValue('phone', digits, { shouldValidate: true });
            }}
          />
        </div>
      </label>
      <label>
        <span>Password</span>
        <PasswordInput placeholder="Create a secure password" registerObj={register('password')} />
      </label>
      <PasswordRequirements password={password} />
      <button className="authSubmit" disabled={loading}>
        {loading ? 'Sending code...' : 'Continue'} <ArrowRight size={18} />
      </button>
      <div className="authLinks single">
        <Link to="/login">Already have an account? Sign in</Link>
      </div>
    </AuthForm>
  );
}

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, getValues } = useForm();

  async function submit(values) {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', values);
      setSentEmail(values.email);
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthForm eyebrow="Account recovery" title="Check your inbox" subtitle="We sent password reset instructions to your email address.">
        <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f7f3ec', border: '1px solid #e5ded3', borderRadius: '8px', padding: '10px 18px', fontSize: '0.92rem', color: '#4a453f', marginBottom: '0.5rem' }}>
            <Mail size={16} style={{ color: '#a77b38', flexShrink: 0 }} />
            <span>{sentEmail}</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
            The link expires in 30 minutes. Check your spam folder if you don't see it.
          </p>
        </div>
        <div className="authLinks single"><Link to="/login">Return to sign in</Link></div>
      </AuthForm>
    );
  }

  return (
    <AuthForm eyebrow="Account recovery" title="Reset your password" subtitle="Enter the email linked to your guest account and we will send reset instructions." onSubmit={handleSubmit(submit)} error={error}>
      <label><span>Email address</span><div className="authField"><Mail size={18} /><input placeholder="you@example.com" {...register('email')} /></div></label>
      <button className="authSubmit" disabled={loading}>{loading ? 'Sending...' : 'Send reset instructions'} <ArrowRight size={18} /></button>
      <div className="authLinks single"><Link to="/login">Return to sign in</Link></div>
    </AuthForm>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch } = useForm();
  const password = watch('password') || '';

  async function submit(values) {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthForm eyebrow="Account recovery" title="Invalid link" subtitle="This password reset link is invalid or has already been used.">
        <div className="authLinks single"><Link to="/forgot-password">Request a new link</Link></div>
      </AuthForm>
    );
  }

  if (done) {
    return (
      <AuthForm eyebrow="Account recovery" title="Password updated!" subtitle="Your password has been changed successfully. Redirecting you to sign in…">
        <div className="authLinks single"><Link to="/login">Sign in now</Link></div>
      </AuthForm>
    );
  }

  return (
    <AuthForm eyebrow="Account recovery" title="Choose a new password" subtitle="Enter a strong new password for your Aurora Stay account." onSubmit={handleSubmit(submit)} error={error}>
      <label>
        <span>New password</span>
        <PasswordInput placeholder="Create a strong password" registerObj={register('password')} />
      </label>
      <PasswordRequirements password={password} />
      <button className="authSubmit" disabled={loading}>{loading ? 'Saving...' : 'Set new password'} <ArrowRight size={18} /></button>
      <div className="authLinks single"><Link to="/forgot-password">Request a new link</Link></div>
    </AuthForm>
  );
}

function AuthForm({ eyebrow, title, subtitle, children, onSubmit, error, message }) {
  return (
    <main className="authPage">
      <section className="authShell">
        <aside className="authAside">
          <Logo />
          <div>
            <span className="eyebrow">Aurora Stay Hotel</span>
            <h2>Manage your stay with confidence.</h2>
            <p>Access reservations, booking references, cancellation options, and guest details through a private account.</p>
          </div>
          <div className="authAsideFacts">
            <span><ShieldCheck size={18} /> Protected guest accounts</span>
            <span><CalendarCheck size={18} /> Easy reservation tracking</span>
          </div>
        </aside>
        <form className="authBox" onSubmit={onSubmit}>
          <div className="authHeader">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          {error && <p className="error authNotice">{error}</p>}
          {message && <p className="success authNotice">{message}</p>}
        </form>
      </section>
    </main>
  );
}

