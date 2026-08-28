import { FormEvent, useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, Truck, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const Logo = () => (
  <div className="flex flex-col items-center justify-center mb-8">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand shadow-lg mb-4">
      <Truck className="h-7 w-7 text-black" strokeWidth={2.5} />
    </div>
    <h1 className="text-2xl font-bold text-content-primary tracking-wide">IntelliTrack</h1>
    <p className="mt-1 text-sm text-content-secondary text-center max-w-sm">Customer Relationship Management and Job Order Registration System</p>
  </div>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('intelitrack-theme-dark');
      if (stored !== null) return stored === 'true';
      return true; // default to dark
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('intelitrack-theme-dark', String(isDark));
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [isDark]);

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <>
      <Head title="Sign In" />
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-app px-4 font-sans text-content-primary transition-colors duration-200">
        
        <Logo />

        <div className="w-full max-w-[420px]">
          {/* Card */}
          <div className="rounded-2xl bg-surface-card p-8 shadow-xl border border-border-subtle transition-colors duration-200">
            <h2 className="text-xl font-bold text-content-primary mb-6">Sign In</h2>

            <form className="space-y-5" onSubmit={submit}>
              {/* Email or Username */}
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-2" htmlFor="email">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-content-secondary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    autoComplete="email"
                    placeholder="Enter your credentials"
                    className="w-full rounded-lg border border-border-default bg-surface-input py-3 pl-10 pr-4 text-sm text-content-primary placeholder:text-content-secondary/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                    required
                  />
                </div>
                {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-content-secondary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border-default bg-surface-input py-3 pl-10 pr-10 text-sm text-content-primary placeholder:text-content-secondary/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-secondary hover:text-content-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="mt-1 block text-xs text-red-500">{errors.password}</span>}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={e => setData('remember', e.target.checked)}
                    className="h-4 w-4 rounded border-border-default bg-surface-input text-brand focus:ring-brand focus:ring-offset-surface-card"
                  />
                  <span className="text-xs text-content-secondary">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-xs font-medium text-brand hover:text-brand-hover transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-brand py-3 text-sm font-bold text-black transition-colors hover:bg-brand-hover disabled:opacity-70"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent"></div>
                    Signing in...
                  </div>
                ) : ( 'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Theme Switch */}
          <div className="mt-8 flex justify-center">
            <button 
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-xs font-medium text-content-secondary hover:text-content-primary transition-colors border border-border-subtle"
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>Switch to {isDark ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>
          
          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-content-secondary/70">
            © 2024 IntelliTrack Core Transaction 1. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
};

export default Login;