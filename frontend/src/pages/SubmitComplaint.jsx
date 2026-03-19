import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { complaintAPI } from '../lib/api.js';
import LocationPicker from '../components/maps/LocationPicker.jsx';

function SubmitComplaint() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [formData, setFormData] = useState({
    image: null,
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    city: 'Delhi',
    locationImportance: 0.5,
    populationDensity: 0.5,
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [nearbyReports, setNearbyReports] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        // Trigger AI analysis
        runAIAnalysis(file);
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
    setError('');
  };

  const runAIAnalysis = async (file) => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const analysisFormData = new FormData();
      analysisFormData.append('image', file);
      const response = await complaintAPI.analyze(analysisFormData);
      if (response.data.success) {
        setAiAnalysis(response.data.data);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Add analysis trigger to handleChange

  const handleLocationSelect = (locationData) => {
    setFormData({
      ...formData,
      latitude: locationData.lat.toString(),
      longitude: locationData.lng.toString(),
      address: locationData.address || formData.address,
      city: locationData.city || formData.city,
      locationImportance: locationData.locationImportance || 0.5,
      populationDensity: locationData.populationDensity || 0.5,
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const handleNearbyReportsFound = (reports) => {
    setNearbyReports(reports);
  };

  // Check for duplicates when location or nearbyReports change
  useEffect(() => {
    if (formData.latitude && formData.longitude && nearbyReports.length > 0) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);

      const duplicate = nearbyReports.find(report => {
        if (!report.location?.coordinates) return false;
        const [rLng, rLat] = report.location.coordinates;
        const dist = calculateDistance(lat, lng, rLat, rLng);
        return dist < 100 && report.status !== 'resolved'; // 100 meters threshold
      });

      if (duplicate) {
        setDuplicateWarning(duplicate);
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [formData.latitude, formData.longitude, nearbyReports]);

  const validate = () => {
    if (!formData.image) {
      setError('Please upload an evidence image');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Please pinpoint the location on the map');
      return false;
    }
    if (!formData.address) {
      setError('Address resolution failed. Try clicking again.');
      return false;
    }
    return true;
  };

  const saveFavorite = (type) => {
    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location first');
      return;
    }
    const favorite = {
      lat: formData.latitude,
      lng: formData.longitude,
      address: formData.address,
      city: formData.city
    };
    localStorage.setItem(`fav_${type}`, JSON.stringify(favorite));
    alert(`${type.toUpperCase()} location saved!`);
  };

  const loadFavorite = (type) => {
    const saved = localStorage.getItem(`fav_${type}`);
    if (saved) {
      const favorite = JSON.parse(saved);
      setFormData({
        ...formData,
        latitude: favorite.lat,
        longitude: favorite.lng,
        address: favorite.address,
        city: favorite.city
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('image', formData.image);
      submitFormData.append('latitude', formData.latitude);
      submitFormData.append('longitude', formData.longitude);
      submitFormData.append('address', formData.address);
      if (formData.description) {
        submitFormData.append('description', formData.description);
      }
      submitFormData.append('isAnonymous', isAnonymous);

      const response = await complaintAPI.submit(submitFormData);

      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit complaint';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/50 pb-12">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shadow-brand-600/20">♻️</div>
              <span className="font-black text-xl tracking-tighter text-gray-900 italic">Swachh<span className="text-brand-600">City</span></span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Citizen Member</p>
                <p className="text-sm font-black text-gray-900">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="group flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all active:scale-95 border border-red-100/50"
              >
                <span className="text-base group-hover:rotate-12 transition-transform">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-premium border border-white p-8 sm:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-brand-600 font-black text-[10px] uppercase tracking-widest transition-colors mb-6"
            >
              <span>⬅️</span>
              <span>Back to Dashboard</span>
            </button>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2 italic">Report <span className="text-brand-600">Garbage</span></h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
              Upload photo and mark garbage location
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-2xl bg-red-50 p-4 border border-red-100 animate-shake">
              <div className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="mb-8 rounded-2xl bg-amber-50 p-5 border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex gap-4">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Potential Duplicate</p>
                  <h4 className="font-black text-gray-900 text-sm tracking-tight mb-2 italic">Similar report exists 100m away</h4>
                  <p className="text-xs text-amber-800/80 font-medium mb-4">
                    A report has already been flagged at this location. Do you still want to proceed, or should we just prioritize the existing one?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-600/20"
                    >
                      Support Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-4 py-2 bg-white text-amber-600 border border-amber-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-50 transition-all active:scale-95"
                    >
                      Report Separately
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Image Upload */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Take or Upload Photo *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 hover:bg-white hover:border-brand-200 transition-all group">
                <div className="space-y-2 text-center">
                  {imagePreview ? (
                    <div className="relative group/img">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-64 w-full object-cover rounded-2xl shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: null });
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">📸</div>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-brand-50 rounded-xl px-4 py-2 font-black text-[10px] text-brand-600 uppercase tracking-widest hover:bg-brand-100 transition-colors">
                          <span>Select Image</span>
                          <input
                            type="file"
                            name="image"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleChange}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">JPG, PNG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis Result Card */}
            {(analyzing || aiAnalysis) && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-brand-900/5 rounded-3xl -z-10 group-hover:opacity-100 transition-opacity"></div>
                  <div className="bg-white/40 backdrop-blur-md border border-brand-100 rounded-3xl p-6 shadow-xl shadow-brand-500/5 transition-all group-hover:shadow-brand-500/10 group-hover:border-brand-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 rounded-xl text-lg">🧠</div>
                        <div>
                          <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest leading-none mb-1">AI Analysis</p>
                          <h4 className="font-black text-gray-900 text-sm tracking-tight">Finding Garbage Details</h4>
                        </div>
                      </div>
                      {analyzing ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full">
                          <div className="animate-spin h-3 w-3 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Processing</span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-1 ${aiAnalysis.detected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} rounded-full`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {aiAnalysis.detected ? 'Garbage Detected ✅' : 'No Garbage Found ❌'}
                          </span>
                        </div>
                      )}
                    </div>

                    {!analyzing && aiAnalysis && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity Score</span>
                              <span className="text-sm font-black text-gray-900 italic">{aiAnalysis.severity}/10</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full grad-brand rounded-full transition-all duration-1000"
                                style={{ width: `${aiAnalysis.severity * 10}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-lg">♻️</span>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Waste Category</p>
                              <p className="text-xs font-black text-gray-800 capitalize">{aiAnalysis.garbageType}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-lg">⏳</span>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Estimated Cleanup</p>
                              <p className="text-xs font-black text-gray-800 tracking-tight">{aiAnalysis.estimatedCleanupTime} Hours</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-2xl border border-brand-100/50">
                            <span className="text-lg">🎯</span>
                            <div>
                              <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest leading-none mb-0.5">Recommended Priority</p>
                              <p className="text-xs font-black text-brand-900 tracking-tight">
                                {aiAnalysis.severity >= 7 ? 'HIGH PRIORITY' : aiAnalysis.severity >= 4 ? 'MEDIUM PRIORITY' : 'ROUTINE'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {analyzing && (
                      <div className="space-y-4 py-4">
                        <div className="h-10 bg-gray-50 rounded-2xl animate-pulse"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-16 bg-gray-50 rounded-2xl animate-pulse"></div>
                          <div className="h-16 bg-gray-50 rounded-2xl animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location Picker */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Garbage Location *
              </label>
              <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner h-[400px]">
                <LocationPicker
                  city={formData.city}
                  onLocationSelect={handleLocationSelect}
                  onNearbyReportsFound={handleNearbyReportsFound}
                  height="400px"
                  initialLocation={
                    formData.latitude && formData.longitude
                      ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
                      : null
                  }
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                required
                readOnly
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                placeholder="Select location on map..."
                value={formData.address}
              />
              {/* Favorite Locations */}
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex-1 min-w-[200px] p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group/fav">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Set Quick-Fill</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveFavorite('home')} className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-sm" title="Save as Home">🏠</button>
                      <button type="button" onClick={() => saveFavorite('work')} className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-sm" title="Save as Work">🏢</button>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-200 mx-4"></div>
                  <div className="text-right flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Quick Select</p>
                    <div className="flex gap-2 justify-end">
                      {localStorage.getItem('fav_home') && (
                        <button type="button" onClick={() => loadFavorite('home')} className="text-[10px] font-black text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100 transition-all active:scale-95">HOME</button>
                      )}
                      {localStorage.getItem('fav_work') && (
                        <button type="button" onClick={() => loadFavorite('work')} className="text-[10px] font-black text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100 transition-all active:scale-95">WORK</button>
                      )}
                      {!localStorage.getItem('fav_home') && !localStorage.getItem('fav_work') && (
                        <span className="text-[10px] font-bold text-slate-300 italic">No spots saved yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Details (Optional)
              </label>
              <textarea
                name="description"
                rows="4"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                placeholder="Describe the type of waste, size, or any specific instructions for workers..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="bg-white/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-premium flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🕵️</div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Report Anonymously</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Hide your name from public maps</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${isAnonymous ? 'bg-brand-500' : 'bg-slate-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-500 ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 grad-brand text-white font-black rounded-3xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-xs ${loading ? 'animate-pulse' : ''}`}
              >
                {loading ? 'Sending Report...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitComplaint;
