import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, KeyRound, Mail, Phone, ShieldCheck, UserRound, Eye, EyeOff, Check } from 'lucide-react';
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
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch } = useForm();
  const password = watch('password') || '';

  async function submit(values) {
    const isLengthValid = values.password?.length >= 8;
    const hasLower = /[a-z]/.test(values.password || '');
    const hasUpper = /[A-Z]/.test(values.password || '');
    const hasNumber = /[0-9]/.test(values.password || '');

    if (!isLengthValid || !hasLower || !hasUpper || !hasNumber) {
      setError('Please satisfy all password requirements before continuing.');
      return;
    }

    try {
      await registerUser(values);
      navigate('/account');
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed.');
    }
  }

  return (
    <AuthForm eyebrow="New guest profile" title="Create your account" subtitle="Save your details once, then manage reservations and future stays more easily." onSubmit={handleSubmit(submit)} error={error}>
      <label><span>Full name</span><div className="authField"><UserRound size={18} /><input placeholder="Your full name" {...register('name')} /></div></label>
      <label><span>Email address</span><div className="authField"><Mail size={18} /><input placeholder="you@example.com" {...register('email')} /></div></label>
      <label><span>Phone number</span><div className="authField"><Phone size={18} /><input placeholder="+63 900 000 0000" {...register('phone')} /></div></label>
      <label><span>Password</span><PasswordInput placeholder="Create a secure password" registerObj={register('password')} /></label>
      <PasswordRequirements password={password} />
      <button className="authSubmit">Create account <ArrowRight size={18} /></button>
      <div className="authLinks single"><Link to="/login">Already have an account? Sign in</Link></div>
    </AuthForm>
  );
}

export function ForgotPassword() {
  const [message, setMessage] = useState('');
  const { register, handleSubmit } = useForm();
  async function submit(values) { const { data } = await api.post('/auth/forgot-password', values); setMessage(data.data?.developmentResetToken ? `Temporary reset code: ${data.data.developmentResetToken}` : data.message); }
  return (
    <AuthForm eyebrow="Account recovery" title="Reset your password" subtitle="Enter the email linked to your guest account and we will prepare reset instructions." onSubmit={handleSubmit(submit)} message={message}>
      <label><span>Email address</span><div className="authField"><Mail size={18} /><input placeholder="you@example.com" {...register('email')} /></div></label>
      <button className="authSubmit">Send reset instructions <ArrowRight size={18} /></button>
      <div className="authLinks single"><Link to="/login">Return to sign in</Link></div>
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

