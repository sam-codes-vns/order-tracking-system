import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // ✅ added useLocation
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const location = useLocation(); // ✅ must be inside component

  // ─── Step control ────────────────────────────────────────────────────
  const [step, setStep] = useState(location.state?.step || 1);
  const [userId, setUserId] = useState(location.state?.userId || null);

  // ─── Form fields ─────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || ''); // ✅ prefill email if redirected from login
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  // ─── OTP fields ──────────────────────────────────────────────────────
  const [emailOtp, setEmailOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, verifyEmail } = useAuth(); // ✅ removed verifyPhone
  const navigate = useNavigate();

  // ─── Validation ───────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Step 1: Register → Send OTP ─────────────────────────────────────
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

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────
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
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">

          {/* ── Step Indicator ────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              step === 1 ? 'bg-primary text-white' : 'bg-green-500 text-white'
            }`}>
              {step === 1 ? '1' : '✓'}
            </div>
            <div className={`h-1 w-16 rounded transition-colors ${
              step === 2 ? 'bg-primary' : 'bg-gray-200'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              step === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
          </div>

          {/* STEP 1 — Registration Form */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-primary text-center mb-6">Create Account</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Sending OTP...
                    </span>
                  ) : 'Continue'}
                </button>
              </form>

              <p className="mt-4 text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
              </p>
            </>
          )}

          {/* STEP 2 — OTP Verification */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-primary text-center mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                OTP sent to <span className="font-medium text-gray-700">{email}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent tracking-widest text-center text-lg"
                  />
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary text-sm mt-1 hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="w-full text-gray-500 text-sm hover:underline"
                >
                  ← Back to registration
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;