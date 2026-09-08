import { FormEvent, useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Moon,
  Sun,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardHat,
} from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  titleHighlight: string;
  description: string;
  badge: string;
  stats: { label: string; value: string }[];
}

const SLIDES: Slide[] = [
  {
    id: 0,
    image: '/images/home-background-photo.jpg',
    eyebrow: 'Your Lifting Equipment Expert',
    titleLine1: 'From Heavy',
    titleLine2: 'Lifting',
    titleHighlight: 'To Final Touches.',
    description:
      'Alibaton Construction Inc. delivers reliable equipment rental, tower crane solutions, technical support, fit-out construction and waterproofing services for projects across the Philippines.',
    badge: 'Flagship Lifting & Fleet',
    stats: [
      { label: 'Established', value: '2017' },
      { label: 'Projects', value: '60+' },
      { label: 'Certified', value: 'ISO 9001' },
      { label: 'Satisfaction', value: '95%' },
    ],
  },
  {
    id: 1,
    image: '/images/commercial-building.jpg',
    eyebrow: 'Tower Crane Rental & Sales',
    titleLine1: 'Built To Lift',
    titleLine2: 'Demanding',
    titleHighlight: 'Projects.',
    description:
      'From equipment selection and mobilization to licensed operators, riggers and technical support, we provide complete tower crane solutions tailored to your project requirements.',
    badge: 'Commercial & High-Rise Fleet',
    stats: [
      { label: 'Crane Type', value: 'Topless' },
      { label: 'Jib Reach', value: 'Up to 70m' },
      { label: 'Safety Record', value: '100%' },
      { label: 'Support', value: '24/7 Field' },
    ],
  },
  {
    id: 2,
    image: '/images/cement-plant-wide.jpg',
    eyebrow: 'Reliable Project Support',
    titleLine1: 'From Planning',
    titleLine2: 'To Project',
    titleHighlight: 'Completion.',
    description:
      'We combine proven equipment, experienced personnel, maintenance support and responsive after-sales service to keep major construction and industrial projects moving safely and efficiently.',
    badge: 'Heavy Industrial & Infrastructure',
    stats: [
      { label: 'Uptime Rate', value: '99.4%' },
      { label: 'Technicians', value: 'Certified' },
      { label: 'Mobilization', value: 'Nationwide' },
      { label: 'Coverage', value: 'Luzon-Min' },
    ],
  },
];

const Login = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Fully automatic non-stop slide rotation every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const [savedEmail] = useState(() => {
    try {
      return localStorage.getItem('alibaton_remember_email') || '';
    } catch {
      return '';
    }
  });

  const { data, setData, post, processing, errors } = useForm({
    email: savedEmail,
    password: '',
    remember: savedEmail ? true : true,
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (data.remember && data.email) {
        localStorage.setItem('alibaton_remember_email', data.email);
      } else {
        localStorage.removeItem('alibaton_remember_email');
      }
    } catch {}
    post('/login');
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <>
      <Head title="Enterprise Sign In | Alibaton Construction - IntelliTrack" />

      {/* Main Fullscreen Background Container */}
      <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#f2b600] selection:text-slate-950">
        {/* Swiper Background Layers with Smooth Crossfade */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform ${
                index === currentSlide
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
              style={{
                backgroundImage: `url('${slide.image}')`,
                backgroundPosition: 'center center',
              }}
            />
          ))}

          {/* Deep Contrast Multi-Stop Gradient Overlays for Guaranteed Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/90 lg:from-slate-950/95 lg:via-slate-950/80 lg:to-slate-950/90" />
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/95" />
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#f2b600]/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />
        </div>

        {/* Top Navbar Header */}
        <header className="relative z-20 w-full border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            
            {/* IntelliTrack Brand */}
            <div className="flex items-center gap-3.5">
              <img
                src="/images/intellitrack-logo-white.png"
                alt="IntelliTrack"
                className="h-7 w-auto object-contain transition-transform hover:scale-105"
              />
              <div className="border-l border-slate-700/80 pl-3.5">
                <p className="text-[10px] text-slate-400">Enterprise Operations Platform</p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 shadow-sm transition-all"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-[#f2b600]" /> : <Moon className="h-4 w-4 text-slate-300" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Split Content Area */}
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-14">
            
            {/* Left Column: Swiper Dynamic Content (Slides 1, 2, 3) */}
            <div className="space-y-6 lg:col-span-7">
              
              {/* Category Badge */}
              <div className="flex items-center gap-2.5">
                <div className="h-1 w-8 rounded-full bg-[#f2b600]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#f2b600]">
                  {activeSlide.eyebrow}
                </span>
              </div>

              {/* Dynamic Slide Headline with smooth transition key */}
              <div key={activeSlide.id} className="transition-all duration-700 ease-out">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.06] font-sans">
                  {activeSlide.titleLine1}<br />
                  {activeSlide.titleLine2}<br />
                  <span className="text-[#f2b600]">{activeSlide.titleHighlight}</span>
                </h1>

                {/* Company Description */}
                <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {activeSlide.description}
                </p>
              </div>

              {/* Slide Specific Stats & Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {activeSlide.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-3.5 backdrop-blur-md transition-all hover:border-slate-700"
                  >
                    <p className="text-xl sm:text-2xl font-black text-[#f2b600]">{stat.value}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Feature Points from Core Alibaton Solutions */}
              <div className="space-y-2 pt-1 hidden sm:block">
                {[
                  'Tower Crane Rental, Sales, Telescoping & Climbing Services',
                  'Licensed Heavy Equipment Riggers & Certified Operators',
                  'Enterprise Quotation Approval & Real-Time Fleet Dispatch',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#f2b600] shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column: Ultra-Sleek Enterprise Sign-In Card */}
            <div className="w-full lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl transition-all">
                
                {/* Decorative Top Gold Edge */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#f2b600] via-amber-300 to-[#f2b600]" />

                {/* Ambient Card Glow */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#f2b600]/10 blur-2xl" />

                {/* Form Header */}
                <div className="mb-7">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2b600] text-slate-950 font-black shadow-md shadow-amber-500/20">
                      <HardHat className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        Enterprise Sign In
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Enter your authorized Alibaton Construction credentials to access the system dashboard.
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={submit} className="space-y-5">
                  
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2" htmlFor="email">
                      Work Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-[#f2b600] transition-colors">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        autoComplete="email"
                        placeholder="name@alibaton.com.ph"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#f2b600] focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-[#f2b600]/15 shadow-inner transition-all"
                        required
                      />
                    </div>
                    {errors.email && (
                      <span className="mt-1.5 block text-xs font-medium text-rose-400">{errors.email}</span>
                    )}
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="password">
                        Password
                      </label>
                      <a
                        href="#forgot"
                        onClick={e => e.preventDefault()}
                        className="text-xs font-medium text-[#f2b600] hover:text-amber-300 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-[#f2b600] transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-[#f2b600] focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-[#f2b600]/15 shadow-inner transition-all"
                        required
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
                      <span className="mt-1.5 block text-xs font-medium text-rose-400">{errors.password}</span>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-[#f2b600] focus:ring-[#f2b600]/30"
                      />
                      <span className="text-xs font-medium text-slate-300">Remember me</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#f2b600] hover:bg-[#e0a800] py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {processing ? (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>256-bit Encrypted Enterprise Session</span>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* Bottom Footer Bar */}
        <footer className="relative z-20 w-full border-t border-slate-800/70 bg-slate-950/70 py-4 backdrop-blur-md text-slate-400 text-xs">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Alibaton Construction Incorporated. 137 Panay Avenue, Diliman, Quezon City, NCR 1103.</p>
            <p className="flex items-center gap-2">
              <span>Powered by IntelliTrack Enterprise</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[10px] text-slate-500">v2.4 LTS</span>
            </p>
          </div>
        </footer>

      </div>
    </>
  );
};

export default Login;