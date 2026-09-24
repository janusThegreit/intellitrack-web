import { FormEvent, useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

interface Props {
  tokenStatus: 'valid' | 'already_used' | 'expired' | 'invalid';
  token?: string;
  email?: string;
  userName?: string;
  expiresAt?: string;
  message?: string;
  usedAt?: string;
}

export default function ResetPassword({
  tokenStatus,
  token = '',
  email = '',
  userName = '',
  expiresAt,
  message,
  usedAt,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    try {
      document.documentElement.classList.add('dark');
    } catch {}
  }, []);

  const { data, setData, post, processing, errors } = useForm({
    token: token,
    password: '',
    password_confirmation: '',
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post('/reset-password');
  };

  // Password validation rules
  const hasMinLength = data.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(data.password);
  const hasLowerCase = /[a-z]/.test(data.password);
  const hasNumber = /[0-9]/.test(data.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(data.password);
  const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

  const strengthCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthColor =
    strengthCount <= 2 ? 'bg-rose-500' : strengthCount <= 4 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <>
      <Head title="Set New Password | Alibaton IntelliTrack" />

      <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#f2b600] selection:text-slate-950">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url('/images/home-background-photo.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/98" />
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#f2b600]/10 blur-[130px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]" />
        </div>

        {/* Top Navbar */}
        <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/intellitrack-logo-white.png"
                alt="IntelliTrack"
                className="h-7 w-auto object-contain"
              />
              <div className="border-l border-slate-700/80 pl-3.5 hidden sm:block">
                <p className="text-[11px] text-slate-400">Enterprise Operations Platform</p>
              </div>
            </div>

            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </header>

        {/* Main Content Card Container */}
        <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center justify-center px-4 py-10">
          <div className="w-full">
            {tokenStatus === 'valid' ? (
              /* Valid Token State - Password Reset Form */
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/85 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl">
                {/* Decorative Top Gold Edge */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#f2b600] via-amber-300 to-[#f2b600]" />

                {/* Form Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2b600] to-amber-500 text-slate-950 shadow-md shadow-amber-500/25">
                      <KeyRound className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Set New Password
                      </h1>
                      <p className="text-xs text-slate-400">
                        Administrator-Authorized One-Time Security Update
                      </p>
                    </div>
                  </div>

                  {/* Requester Identity Pill */}
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <UserCheck className="h-4 w-4 text-[#f2b600] shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-white">{userName}</span>
                        <span className="mx-1.5 text-slate-500">•</span>
                        <span className="text-slate-400">{email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {expiresAt && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>
                            Expires {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      )}
                      <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Single-Use
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reset Form */}
                <form onSubmit={submit} className="space-y-5">
                  {/* New Password Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2" htmlFor="password">
                      New Security Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-[#f2b600] transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="Enter secure new password"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-[#f2b600] focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-[#f2b600]/15 shadow-inner transition-all"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.password}</span>
                      </span>
                    )}

                    {/* Password Strength Meter */}
                    {data.password && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Password Strength:</span>
                          <span
                            className={
                              strengthCount <= 2
                                ? 'text-rose-400 font-semibold'
                                : strengthCount <= 4
                                ? 'text-amber-400 font-semibold'
                                : 'text-emerald-400 font-semibold'
                            }
                          >
                            {strengthCount <= 2 ? 'Weak' : strengthCount <= 4 ? 'Moderate' : 'Strong & Compliant'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${(strengthCount / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2" htmlFor="password_confirmation">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-[#f2b600] transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="password_confirmation"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-[#f2b600] focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-[#f2b600]/15 shadow-inner transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {data.password_confirmation && !passwordsMatch && (
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Passwords do not match.</span>
                      </span>
                    )}
                  </div>

                  {/* Requirements Checklist */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1.5 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-2">
                      Password Requirements:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {hasMinLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={hasMinLength ? 'text-emerald-300' : ''}>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasUpperCase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={hasUpperCase ? 'text-emerald-300' : ''}>Uppercase letter (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasLowerCase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={hasLowerCase ? 'text-emerald-300' : ''}>Lowercase letter (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={hasNumber ? 'text-emerald-300' : ''}>Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        {hasSpecial ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={hasSpecial ? 'text-emerald-300' : ''}>Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  {/* Single-Use Warning Notice */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Single-Use Security Notice: </span>
                      <span>
                        Once you confirm your new password, this link will be permanently burned and deactivated.
                        {expiresAt && (
                          <> This link also expires automatically at {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</>
                        )}
                        {' '}If you ever need to reset again, a new request must be approved by an administrator.
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing || !hasMinLength || !passwordsMatch}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#f2b600] hover:bg-[#e0a800] py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating Password & Burning Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Update Password & Deactivate Link</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>256-bit Encrypted Enterprise IAM Session</span>
                </div>
              </div>
            ) : tokenStatus === 'already_used' ? (
              /* Already Used State - Link is dead and burned */
              <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-center">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-5 shadow-lg shadow-rose-500/10">
                  <XCircle className="h-8 w-8" />
                </div>

                <div className="inline-block rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30 mb-3 uppercase tracking-wider">
                  Link Already Used & Burned
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white mb-3">
                  This One-Time Link Has Expired
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
                  For your enterprise account security, this password reset link was configured for{' '}
                  <span className="text-[#f2b600] font-semibold">one-time use only</span> and has already been used to change the password.
                </p>

                {usedAt && (
                  <div className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-rose-400" />
                    <span>Deactivated: <strong className="text-rose-300 font-medium">{usedAt}</strong></span>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400 max-w-md mx-auto mb-7 text-left space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Need to reset your password again?</span>
                  </div>
                  <p>
                    Please return to the login page and submit a brand new password reset request to your System Administrator. Once approved, the admin will issue a fresh one-time link.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#f2b600] hover:bg-[#e0a800] px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Expired or Invalid Token State */
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-center">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-slate-600 to-amber-500" />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-5 shadow-lg shadow-amber-500/10">
                  <Clock className="h-8 w-8" />
                </div>

                <div className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 mb-3 uppercase tracking-wider">
                  {tokenStatus === 'expired' ? 'Link Expired' : 'Invalid Token'}
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white mb-3">
                  {tokenStatus === 'expired'
                    ? 'Reset Link Has Expired'
                    : 'Invalid Reset Link'}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
                  {message ||
                    'This password reset link is invalid, does not exist, or has exceeded its 24-hour expiration window.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#f2b600] hover:bg-[#e0a800] px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 py-4 backdrop-blur-md text-slate-400 text-xs">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Alibaton Construction Incorporated. Diliman, Quezon City, Philippines.</p>
            <p className="flex items-center gap-2">
              <span>IntelliTrack Enterprise IAM</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[10px] text-slate-500">v2.4 LTS</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
