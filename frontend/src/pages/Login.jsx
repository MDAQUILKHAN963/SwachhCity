import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { login, logout, isAuthenticated, loading, error, user } = useAuthStore();

  useEffect(() => {
    logout();
  }, []);

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
    if (!formData.email) {
      newErrors.email = 'Email required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    if (result.success) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        if (storedUser.role === 'admin') navigate('/admin/dashboard');
        else if (storedUser.role === 'worker') navigate('/worker/dashboard');
        else navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-24 left-1/2 w-64 h-64 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[3rem] shadow-premium border border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto shadow-xl shadow-brand-600/30 mb-6 rotate-3">♻️</div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Swachh<span className="text-brand-600">City</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Helping Clean our Cities</p>
          </div>

          {/* Quick Demo Helper */}
          <div className="flex justify-center gap-2 mb-8 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
            <button onClick={() => setFormData({ email: 'citizen@test.com', password: 'password123' })} className="px-3 py-2 text-[8px] font-black text-gray-500 hover:text-brand-600 uppercase tracking-widest transition-colors flex items-center gap-1">👤 <span className="hidden sm:inline">Citizen</span></button>
            <button onClick={() => setFormData({ email: 'worker@city.com', password: 'password123' })} className="px-3 py-2 text-[8px] font-black text-gray-500 hover:text-brand-600 uppercase tracking-widest transition-colors flex items-center gap-1">👷 <span className="hidden sm:inline">Worker</span></button>
            <button onClick={() => setFormData({ email: 'admin@city.com', password: 'admin123' })} className="px-3 py-2 text-[8px] font-black text-gray-500 hover:text-brand-600 uppercase tracking-widest transition-colors flex items-center gap-1">🛡️ <span className="hidden sm:inline">Admin</span></button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-[10px] font-black uppercase tracking-widest animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-6 py-4 bg-white/50 border border-gray-100 rounded-2xl font-bold text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
                placeholder="operator@swachh.city"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-6 py-4 bg-white/50 border border-gray-100 rounded-2xl font-bold text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 grad-brand text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
            New user?{' '}
            <Link to="/register" className="text-brand-600 hover:underline inline-block ml-1">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-50">
          Powered by SwachhCity v2.0
        </p>
      </div>
    </div>
  );
}

export default Login;
