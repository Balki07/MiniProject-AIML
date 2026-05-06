// src/pages/VerifyEmailPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Zap, Mail, RotateCcw, CheckCircle } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // Redirect to login if no email param
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  const otp = digits.join('');

  const handleDigitChange = (index, value) => {
    // Accept only single digits
    const sanitized = value.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);

    // Auto-advance focus
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus last filled box
    const lastIdx = Math.min(pasted.length, 5);
    inputRefs.current[lastIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setVerified(true);
      login(data);
      toast.success('Email verified! Welcome to JBAdX 🎉');
      setTimeout(() => navigate('/profile'), 1800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code.');
      // Shake the inputs on error
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email!');
      setResendTimer(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.length === 6 && digits.every(d => d !== '')) {
      handleSubmit();
    }
  }, [otp]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-fuchsia-400/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={verified ? { scale: [1, 1.2, 1] } : {}}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-500 ${
                verified
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                  : 'bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-indigo-600'
              }`}
            >
              {verified ? (
                <CheckCircle size={28} className="text-white" />
              ) : (
                <Zap size={26} className="text-white" fill="white" />
              )}
            </motion.div>

            <h1 className="text-2xl font-bold text-white">
              {verified ? 'Email Verified!' : 'Verify your email'}
            </h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              {verified
                ? 'Redirecting you to your profile...'
                : <>We sent a <strong className="text-white/80">6-digit code</strong> to<br />
                    <span className="text-indigo-400 font-semibold">{email}</span>
                  </>
              }
            </p>
          </div>

          {!verified && (
            <>
              {/* OTP Input Grid */}
              <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      id={`otp-digit-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 bg-white/5 text-white outline-none transition-all duration-200 focus:scale-105 ${
                        d
                          ? 'border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.4)]'
                          : 'border-white/15 focus:border-indigo-400'
                      }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  {loading ? (
                    <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <><Mail size={18} /> Verify Email</>
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="flex items-center justify-center gap-2 mt-5">
                <span className="text-white/40 text-sm">Didn't receive it?</span>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resending}
                  className="text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                  style={{ color: resendTimer > 0 ? undefined : '#a78bfa' }}
                >
                  <RotateCcw size={13} />
                  {resending
                    ? 'Sending...'
                    : resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : 'Resend Code'}
                </button>
              </div>

              <p className="text-center text-white/25 text-xs mt-4">
                Code expires in 15 minutes · Check your spam folder if not received
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
