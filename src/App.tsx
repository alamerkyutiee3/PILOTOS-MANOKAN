import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc,
  getDoc,
  setDoc,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, UserRole } from './types/erp';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Bell,
  UtensilsCrossed,
  Drumstick,
  UserCog,
  ShieldCheck,
  Zap,
  Headphones,
  Facebook,
  Mail,
  Phone,
  UserCircle,
  Camera,
  Save,
  CheckCircle2,
  Calendar,
  MapPin,
  Cake,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components (will create these next)
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import POS from './components/pos/POS';
import Reports from './components/reports/Reports';
import UserManagement from './components/users/UserManagement';

// Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// --- Profile Modal Component ---
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    fullName: profile.fullName || '',
    age: profile.age?.toString() || '',
    address: profile.address || '',
    birthdate: profile.birthdate || '',
    profilePic: profile.profilePic || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 efficiency
        alert('File is too large. Please select an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: formData.displayName,
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : null,
        address: formData.address,
        birthdate: formData.birthdate,
        profilePic: formData.profilePic
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-slate-300" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-slate-100 group-hover:bg-slate-50 transition-colors">
                <Camera size={16} className="text-slate-500" />
              </div>
              <input 
                id="photo-upload"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
              Click to Change Photo
            </p>
            <p className="text-[11px] font-medium text-orange-600 mt-1 uppercase tracking-wider">
              {profile.role} Account
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Email</label>
              <input type="text" disabled value={profile.email} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm opacity-60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              placeholder="Full Name"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Birthdate</label>
              <input 
                type="date" 
                value={formData.birthdate}
                onChange={e => setFormData({...formData, birthdate: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              placeholder="Complete Address"
            />
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : saveSuccess ? <><CheckCircle2 size={18} /> Saved</> : 'Update Profile'}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          // Check if this is the initial setup admin
          const isInitialAdmin = user.email?.toLowerCase() === 'pilotosjm3@gmail.com' || user.email?.toLowerCase() === 'alhakimelbanez@gmail.com';
          if (isInitialAdmin) {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!.toLowerCase(),
              role: 'admin',
              displayName: user.displayName || 'Head Admin',
              createdAt: Timestamp.now()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          } else {
            // Check authorized_emails collection
            const authDoc = await getDoc(doc(db, 'authorized_emails', user.email!.toLowerCase()));
            if (authDoc.exists()) {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email!.toLowerCase(),
                role: 'staff',
                displayName: user.displayName || 'Staff Member',
                createdAt: Timestamp.now()
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setProfile(newProfile);
            } else {
              setProfile(null);
            }
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // Silently ignore if user closed the popup
        return;
      }
      console.error('Auth Error:', error);
      alert('Authentication failed: ' + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, profile, loading, logout } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCog size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-slate-500 mt-4 leading-relaxed">
            Your account hasn't been authorized by an Administrator yet. Please contact management to get started.
          </p>
          <button 
            onClick={logout}
            className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Logout & Try Another Account
          </button>
        </div>
      </div>
    );
  }
  
  if (role && profile.role !== role && profile.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function Layout() {
  const { profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'POS', icon: ShoppingCart, path: '/pos' },
  ];

  if (profile?.role === 'admin') {
    navItems.push(
      { name: 'Inventory', icon: Package, path: '/inventory' },
      { name: 'Reports', icon: BarChart3, path: '/reports' },
      { name: 'User Mgmt', icon: Users, path: '/users' }
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="w-64 bg-slate-900 text-white flex flex-col z-20"
          >
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Drumstick size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight tracking-tight">PILOTOS</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chicken Meat</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => setProfileModalOpen(true)}
                className={`w-full flex items-center gap-3 mb-4 px-2 py-2 rounded-xl transition-colors hover:bg-slate-800 ${
                  profileModalOpen ? 'bg-slate-800' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {profile?.profilePic ? (
                    <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.displayName ? profile.displayName[0] : 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{profile?.displayName}</p>
                  <p className="text-xs text-slate-500 uppercase">{profile?.role}</p>
                </div>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
                id="logout-btn"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            id="sidebar-toggle"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-sm text-slate-600 font-medium">
              Branch: PILOTOS Main
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<ProtectedRoute role="admin"><Inventory /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} />
          </Routes>
        </main>

        {profile && (
          <ProfileModal 
            isOpen={profileModalOpen} 
            onClose={() => setProfileModalOpen(false)} 
            profile={profile} 
          />
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const { login, user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Drumstick size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">PILOTOS MANOKAN</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Chicken Meat Station Management System</p>
        </div>
        <div className="p-8">
          <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700 leading-relaxed font-medium">
            <strong>Security Notice:</strong> Only authorized personnel can access this system. Admins have full oversight of operations.
          </div>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 py-3.5 px-4 rounded-xl font-bold text-slate-700 transition-all active:scale-[0.98] shadow-sm"
            id="google-login"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in as Admin / Staff
          </button>

          {/* Contact Links */}
          <div className="mt-6 space-y-3">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Support</p>
            <div className="flex flex-col gap-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                <Facebook size={16} className="text-blue-600" />
                <span>JM PILOTOS</span>
              </a>
              <a href="mailto:support@pilotos.com" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                <Mail size={16} className="text-red-500" />
                <span>pilotosjm3@gmail.com</span>
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                <Phone size={16} className="text-emerald-600" />
                <span>+63 975 2112 266</span>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-10">
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                <ShieldCheck size={20} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Secure</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                <Zap size={20} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Real-time</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-full">
                <Headphones size={20} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
