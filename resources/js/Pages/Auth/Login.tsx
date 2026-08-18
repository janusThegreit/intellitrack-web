import { FormEvent, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const IntelitrackIcon = () => (
  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] shadow-lg">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 15L8 9L12 13L17 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="5" r="2.2" fill="white"/>
    </svg>
  </div>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <>
      <Head title="Sign In" />
      <main className="flex min-h-screen items-center justify-center bg-[#f1f5f9] px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <IntelitrackIcon />
            <span className="text-xl font-bold text-slate-800">Intelitrack</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to your account to continue.</p>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              {/* Email */}
              <label className="block" htmlFor="email">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</span>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  autoComplete="email"
                  placeholder="you@intelitrack.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                  required
                />
                {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
              </label>

              {/* Password */}
              <label className="block" htmlFor="password">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <a href="/forgot-password" className="text-xs font-medium text-[#2563eb] hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="mt-1 block text-xs text-red-500">{errors.password}</span>}
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {processing ? 'Signing in...' : 'Sign In'}
                {!processing && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Having trouble?{' '}
            <a href="mailto:it@intelitrack.com" className="font-medium text-[#2563eb] hover:underline">
              Contact IT Support
            </a>
          </p>
        </div>
      </main>
    </>
  );
};

export default Login;