import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, KeyRound, Mail, Phone, ShieldCheck, UserRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Logo } from '../components/Logo.jsx';

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
    try { await login(values); navigate('/account'); } catch (e) { setError(e.response?.data?.message || 'Incorrect email and password. Please try again.'); }
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
  const { register, handleSubmit } = useForm();
  async function submit(values) {
    try { await registerUser(values); navigate('/account'); } catch (e) { setError(e.response?.data?.message || 'Registration failed.'); }
  }
  return (
    <AuthForm eyebrow="New guest profile" title="Create your account" subtitle="Save your details once, then manage reservations and future stays more easily." onSubmit={handleSubmit(submit)} error={error}>
      <label><span>Full name</span><div className="authField"><UserRound size={18} /><input placeholder="Your full name" {...register('name')} /></div></label>
      <label><span>Email address</span><div className="authField"><Mail size={18} /><input placeholder="you@example.com" {...register('email')} /></div></label>
      <label><span>Phone number</span><div className="authField"><Phone size={18} /><input placeholder="+63 900 000 0000" {...register('phone')} /></div></label>
      <label><span>Password</span><PasswordInput placeholder="Create a secure password" registerObj={register('password')} /></label>
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

