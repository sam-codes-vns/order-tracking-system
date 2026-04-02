import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

const BENEFITS = [
  'Real-time package tracking 24/7',
  'Up to 1M+ deliveries managed monthly',
  'Instant email & SMS notifications',
  'Dedicated customer support',
];

const Register = () => {
  const location = useLocation();

  const [step, setStep] = useState(location.state?.step || 1);
  const [userId, setUserId] = useState(location.state?.userId || null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [agreed, setAgreed] = useState(false);

  const [emailOtp, setEmailOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, verifyEmail } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreed) newErrors.agreed = 'You must accept the Terms & Conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register(name, email, password, role, phone);
      setUserId(data.userId);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!emailOtp) {
      toast.error('Please enter the email OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmail(userId, emailOtp);
      if (res.fullyVerified) {
        toast.success('Account verified! Welcome 🎉');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post('/api/auth/resend-otp', { userId });
      toast.success('OTP resent to your email ✅');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Left panel – benefits (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-brand-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white"/>
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#dots)"/>
          </svg>
        </div>
        <div className="relative text-white max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Ship365</span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Start shipping smarter today</h2>
          <p className="text-white/80 mb-10 leading-relaxed">
            Join thousands of businesses and individuals who trust Ship365 for all their delivery needs.
          </p>
          <ul className="space-y-4">
            {BENEFITS.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-brand-blue dark:text-white">Ship<span className="text-brand-purple">365</span></span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                step === 1 ? 'bg-brand-gradient text-white' : 'bg-green-500 text-white'
              }`}>
                {step === 1 ? '1' : '✓'}
              </div>
              <div className={`h-1 w-16 rounded transition-colors ${
                step === 2 ? 'bg-brand-blue' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                step === 2 ? 'bg-brand-gradient text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                2
              </div>
            </div>

            {/* STEP 1 — Registration Form */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">Create Account</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">Fill in your details to get started</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${
                        errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${
                          errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Register As</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Delivery Agent</option>
                    </select>
                  </div>

                  {/* T&C checkbox */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        I agree to the{' '}
                        <a href="#terms" onClick={(e) => e.preventDefault()} className="text-brand-blue hover:underline font-medium">Terms &amp; Conditions</a>
                        {' '}and{' '}
                        <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-brand-blue hover:underline font-medium">Privacy Policy</a>
                      </span>
                    </label>
                    {errors.agreed && <p className="text-red-500 text-sm mt-1">{errors.agreed}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-brand-gradient text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Sending OTP...
                      </span>
                    ) : 'Create Account'}
                  </button>
                </form>

                <p className="mt-5 text-center text-gray-600 dark:text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-brand-blue font-medium hover:underline">Sign In</Link>
                </p>
              </>
            )}

            {/* STEP 2 — OTP Verification */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Verify Your Email
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                  OTP sent to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                </p>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label htmlFor="emailOtp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email OTP</label>
                    <input
                      id="emailOtp"
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white tracking-widest text-center text-lg placeholder-gray-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-brand-blue text-sm mt-1 hover:underline disabled:opacity-50"
                    >
                      {resending ? 'Resending...' : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-brand-gradient text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Verifying...
                      </span>
                    ) : 'Verify & Complete Registration'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-gray-500 dark:text-gray-400 text-sm hover:underline"
                  >
                    ← Back to registration
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            <Link to="/" className="hover:text-brand-blue dark:hover:text-brand-blue transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
