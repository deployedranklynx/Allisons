import React, { useState } from "react";
import { User, AuthModalMode } from "../types";
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserChange: (user: User | null) => void;
  initialMode?: AuthModalMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
  initialMode = "signup",
}) => {
  const [mode, setMode] = useState<AuthModalMode>(() => (user ? "profile" : initialMode));
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasReservedPro, setHasReservedPro] = useState<boolean>(user?.interestedInPro || false);

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("ranklynx_token", data.token);
        localStorage.setItem("ranklynx_user", JSON.stringify(data.user));
        onUserChange(data.user);
        setMode("profile");
        setSuccessMsg("Account created! You now have Early Adopter Free Tier access.");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Failed to create account.");
      }
    } catch {
      setErrorMsg("Network error during sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("ranklynx_token", data.token);
        localStorage.setItem("ranklynx_user", JSON.stringify(data.user));
        onUserChange(data.user);
        setMode("profile");
        setSuccessMsg("Logged in successfully!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Invalid email or password.");
      }
    } catch {
      setErrorMsg("Network error during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@ranklynx.com");
    setPassword("password123");
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@ranklynx.com", password: "password123" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("ranklynx_token", data.token);
        localStorage.setItem("ranklynx_user", JSON.stringify(data.user));
        onUserChange(data.user);
        setMode("profile");
      }
    } catch {
      setErrorMsg("Demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ranklynx_token");
    localStorage.removeItem("ranklynx_user");
    onUserChange(null);
    setMode("signin");
  };

  const handleReservePro = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth/upgrade-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setHasReservedPro(true);
        const updated = { ...user, interestedInPro: true };
        localStorage.setItem("ranklynx_user", JSON.stringify(updated));
        onUserChange(updated);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-[#E9ECEF] rounded-2xl shadow-xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E9ECEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5FF] text-[#0984E3] flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D3436]">
                {mode === "signup"
                  ? "Create Free Account"
                  : mode === "signin"
                  ? "Sign In to Account"
                  : "User Account & Plan"}
              </h3>
              <p className="text-[11px] text-[#636E72]">
                {mode === "signup"
                  ? "Join early adopters & save your workspace"
                  : mode === "signin"
                  ? "Access your saved SEO workspaces"
                  : "Manage your tier & future upgrades"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: SIGN UP */}
        {/* ------------------------------------------------------------------ */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="p-6 space-y-4">
            <div className="p-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#2D3436] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Early Adopter Free Tier</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-[#636E72] leading-relaxed">
                Full access to all 6 tools (Link Generator, Cleaner, Bulk Opener, Authority Checker, KD, Rank Tracker).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={4}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? "Creating..." : "Create Free Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-2 text-center text-xs text-[#636E72]">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-[#0984E3] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: SIGN IN */}
        {/* ------------------------------------------------------------------ */}
        {mode === "signin" && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@ranklynx.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="relative my-3 text-center">
              <span className="text-[10px] uppercase text-gray-400 bg-white px-2 relative z-10">
                or instant preview
              </span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E9ECEF]"></div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-[#E9ECEF] text-[#2D3436] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              1-Click Demo Account Login
            </button>

            <div className="pt-2 text-center text-xs text-[#636E72]">
              <span>Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-[#0984E3] font-semibold hover:underline cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: USER PROFILE & FUTURE PRO MONETIZATION READY */}
        {/* ------------------------------------------------------------------ */}
        {mode === "profile" && user && (
          <div className="p-6 space-y-5">
            {/* Account Card */}
            <div className="flex items-center gap-3 p-3.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl">
              <div className="w-11 h-11 rounded-full bg-[#0984E3] text-white flex items-center justify-center font-bold text-sm">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#2D3436] truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-[#636E72] truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Free Tier • Early Adopter
                  </span>
                </div>
              </div>
            </div>

            {/* Quota Meter */}
            <div className="p-3 bg-white border border-[#E9ECEF] rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-[#2D3436]">
                <span>Daily Batch Quota</span>
                <span>28 / 100 used</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-[28%] h-full bg-[#0984E3] rounded-full"></div>
              </div>
              <p className="text-[11px] text-[#636E72]">Resets every 24 hours at midnight UTC</p>
            </div>

            {/* Future Paid Tier Teaser & VIP Waitlist */}
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-300/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Pro Subscription Tier</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-bold uppercase">
                  Coming Soon
                </span>
              </div>

              <p className="text-[11px] text-amber-950/80 leading-relaxed">
                We are building the Pro Tier for power webmasters and agencies:
              </p>

              <ul className="text-[11px] text-amber-900 space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Unlimited bulk URL & backlink processing (no caps)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Hourly automated SERP rank checks with email alerts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-amber-600" />
                  <span>100% Ad-Free interface with white-label client PDF exports</span>
                </li>
              </ul>

              {hasReservedPro ? (
                <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>You're on the VIP list! 50% lifetime launch discount reserved.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleReservePro}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pre-Register for Pro (Get 50% Launch Discount)</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <div className="pt-2 border-t border-[#E9ECEF] flex justify-between items-center">
              <span className="text-[11px] text-[#636E72]">
                Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
