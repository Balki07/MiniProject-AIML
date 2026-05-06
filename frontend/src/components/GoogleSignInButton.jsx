// src/components/GoogleSignInButton.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignInButton = ({ label = 'Continue with Google' }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: btnRef.current?.offsetWidth || 400,
      logo_alignment: 'left',
    });
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const { data } = await api.post('/auth/google', {
        credential: response.credential,
      });

      login(data);

      if (data.isNewUser) {
        toast.success('Account created with Google! Complete your profile to post ads.');
        navigate('/profile');
      } else {
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google Sign-In failed. Please try again.');
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white/30 text-sm text-center cursor-not-allowed">
        Google Sign-In not configured
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl" ref={btnRef} id="google-signin-btn" />
  );
};

export default GoogleSignInButton;
