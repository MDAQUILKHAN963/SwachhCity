import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    role: 'citizen',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { register, isAuthenticated, loading, error } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name required';
    if (!formData.email) {
      newErrors.email = 'Email required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Min 6 chars';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mismatch';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    if (result.success) {
      if (formData.role === 'admin') navigate('/admin/dashboard');
      else if (formData.role === 'worker') navigate('/worker/dashboard');
      else navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-24 right-24 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[3rem] shadow-premium border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Create <span className="text-brand-600">Account</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Join SwachhCity</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  name="name"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Account Type</label>
                <select
                  name="role"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-black text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="citizen">👤 Citizen</option>
                  <option value="worker">👷 Worker</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
              <input
                type="email"
                required
                name="email"
                className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="+91 0000000000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Home Address</label>
                <input
                  type="text"
                  name="address"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="e.g. Mumbai, MH"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                <input
                  type="password"
                  required
                  name="password"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  name="confirmPassword"
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-100 rounded-2xl font-bold text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 grad-brand text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline inline-block ml-1">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
