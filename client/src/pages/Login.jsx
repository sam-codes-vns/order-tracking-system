import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.needsVerification) {
        toast.error('Please verify your email first');
        navigate('/register', { state: { step: 2, userId: res.userId, email } });
        return;
      }
      if (res.needsLoginOtp) {
        setUserId(res.userId);
        setUserEmail(res.email || email);
        setCountdown(60);
        setStep(2);
        toast.success('OTP sent to your email!');
        return;
      }
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const userData = await verifyLoginOtp(userId, otp, rememberMe);
      toast.success('Logged in successfully!');
      // Route based on role
      if (userData.role === 'admin') navigate('/admin', { replace: true });
      else if (userData.role === 'agent') navigate('/agent', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await axios.post('/api/auth/resend-otp', { userId });
      setCountdown(60);
      toast.success('OTP resent to your email!');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header with gradient */}
        <div
          className="rounded-t-2xl px-8 py-6 text-center"
          style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
        >
          <h1 className="text-white text-3xl font-bold tracking-wide">Ship365</h1>
          <p className="text-white/80 text-sm mt-1">Your Logistics Partner</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl px-8 py-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              step === 1 ? 'text-white' : 'bg-green-500 text-white'
            }`}
              style={step === 1 ? { background: 'linear-gradient(135deg, #5B5EFF, #B84AF3)' } : {}}
            >
              {step === 1 ? '1' : '✓'}
            </div>
            <div className={`h-1 w-16 rounded transition-colors ${step === 2 ? 'bg-brand-blue' : 'bg-gray-200 dark:bg-gray-600'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              step === 2 ? 'text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400'
            }`}
              style={step === 2 ? { background: 'linear-gradient(135deg, #5B5EFF, #B84AF3)' } : {}}
            >
              2
            </div>
          </div>

          {/* STEP 1 — Credentials */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-1">Welcome Back</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Sign in to your account</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <Link to="/forgot-password" className="text-xs text-brand-blue hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login As</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-brand-blue font-medium hover:underline">
                  Create account
                </Link>
              </p>
            </>
          )}

          {/* STEP 2 — OTP Verification */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
                Verify Your Identity
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                OTP sent to <span className="font-medium text-gray-700 dark:text-gray-200">{userEmail}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent tracking-[0.5em] text-center text-xl font-mono dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive it?"}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || countdown > 0}
                    className="text-brand-blue font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); }}
                  className="w-full text-gray-500 dark:text-gray-400 text-sm hover:underline"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
