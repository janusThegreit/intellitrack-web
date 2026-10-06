import { useEffect, useState, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Layers,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  User,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { formatPeso } from '../../Utils/currency';

interface OverdueRentalItem {
  id: number;
  rental_number: string;
  equipment_name: string | null;
  days_overdue: number;
  rental_end_date: string | null;
}

interface CategoryUtilization {
  category: string;
  total: number;
  rented: number;
  rate: number | null;
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'opportunity' | 'optimal';
  title: string;
  description: string;
  action_label: string;
  action_href: string;
  badge: string;
}

interface AnalyticsData {
  customer_activity: {
    inquiries_total: number;
    active_inquiries: number;
    aging_inquiries: number;
    inquiries_by_status: Record<string, number>;
  };
  quotation_performance: {
    total: number;
    accepted: number;
    rejected: number;
    under_review: number;
    conversion_rate: number | null;
  };
  rental_trends: {
    active: number;
    pending: number;
    overdue: number;
    overdue_items: OverdueRentalItem[];
  };
  equipment_utilization: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    utilization_rate: number | null;
    categories: CategoryUtilization[];
  };
  job_orders: {
    counts: Record<string, number>;
    active: number;
    completed: number;
  };
  projects: Record<string, number>;
  revenue_history: Array<{
    month: string;
    label: string;
    amount: number;
  }>;
  forecast: {
    available: boolean;
    reason?: string;
    month?: string;
    predicted_revenue?: number;
    method?: string;
    trained_at?: string;
    months_with_data?: number;
    months_in_dataset?: number;
    period_start?: string;
    period_end?: string;
    source?: string;
  };
  ai_assistant_available: boolean;
  recommendations: Recommendation[];
}

interface TrainingResult {
  trained: boolean;
  reason?: string;
  algorithm?: string;
  period_start?: string;
  period_end?: string;
  months_with_data?: number;
}

/**
 * Lightweight formatting for AI Copilot markdown responses
 */
const CopilotResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-neutral-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="pt-2 text-base font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        if (trimmed.startsWith('- ')) {
          const itemText = trimmed.replace('- ', '');
          const parts = itemText.split(/(\*\*.*?\*\*)/g);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span>
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-semibold text-white">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}
              </span>
            </div>
          );
        }

        // Standard line with bold parsing
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

const AiAnalytics = () => {
  const { auth } = usePage<{ auth: { user?: { role?: string } } }>().props;
  const role = auth?.user?.role ?? '';
  const canTrainModel = ['super_admin', 'admin', 'administrator'].includes(role);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [training, setTraining] = useState(false);
  const [trainingError, setTrainingError] = useState('');
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);

  // AI Copilot Chatbot State
  const [prompt, setPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Ask a question about the current inquiry, quotation, job order, equipment, rental, or trained revenue-trend data. Responses are available only when the server-side AI provider is configured.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'IntelliTrack AI Copilot',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, copilotLoading]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<AnalyticsData>('/api/analytics/summary');
      setData(response.data);
    } catch (err: unknown) {
      setError(axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || 'Failed to load analytics from current business records.'
        : 'Failed to load analytics from current business records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTrainModel = async () => {
    if (training) return;
    setTraining(true);
    setTrainingError('');
    setTrainingResult(null);

    try {
      const response = await axios.post<TrainingResult>('/api/analytics/train');
      setTrainingResult(response.data);
      await fetchAnalytics();
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ reason?: string; message?: string }>(err)
        ? err.response?.data?.reason || err.response?.data?.message
        : undefined;
      setTrainingError(message || 'The revenue trend model could not be trained.');
    } finally {
      setTraining(false);
    }
  };

  const handleCopilotSubmit = async (customPrompt?: string) => {
    const query = (customPrompt || prompt).trim();
    if (!query || copilotLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setPrompt('');
    setCopilotLoading(true);

    try {
      const response = await axios.post<{ response: string; source: string }>('/api/analytics/copilot', {
        prompt: query,
      });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.data.source,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || 'The AI provider could not complete the request. Please try again later.'
          : 'The AI provider could not complete the request. Please try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'System Diagnostic',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. Ask a question about available business data.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'IntelliTrack AI Copilot',
      },
    ]);
  };

  const quickPrompts = [
    'What does the saved one-month revenue trend estimate show?',
    'Summarize equipment status counts',
    'Summarize quotation counts and acceptance rate',
    'How many rentals are currently overdue?',
  ];

  // Revenue chart calculations
  const history = data?.revenue_history ?? [];
  const allAmounts = history.map((h) => h.amount);
  const maxRevenue = Math.max(...allAmounts, 1);

  if (loading) {
    return (
      <AppLayout title="Data Analysis & AI">
        <Head title="Data Analysis & AI" />
        <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 text-sm text-neutral-300" role="status">
          Loading analytics from current business records…
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Data Analysis & AI">
        <Head title="Data Analysis & AI" />
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300" role="alert">
          <p>{error || 'Analytics data is not available.'}</p>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="mt-4 rounded-lg border border-red-500/40 px-3 py-2 font-semibold hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head title="Data Analysis & Revenue Trend" />
      <AppLayout title="Data Analysis & Revenue Trend">
        <div className="space-y-6 pb-12">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-[#141416] via-[#1a1a1f] to-[#121214] p-6 shadow-xl lg:p-8">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
                    <BrainCircuit className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Current business records
                  </span>
                  <span className="text-xs text-neutral-400">
                    Decision Support System (DSS)
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Data Analysis & Revenue Trend
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
                  Analysis is calculated from existing inquiries, quotations, equipment, rentals, projects, and job orders.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-center">
                <button
                  onClick={fetchAnalytics}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-xs font-semibold text-neutral-200 shadow-sm transition hover:bg-neutral-700 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                  Refresh Data
                </button>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-400 shadow-sm transition hover:bg-amber-500/20"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Standard Reports
                </Link>
              </div>
            </div>
          </div>

          {/* Summary metrics from current records */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Revenue Forecast */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#17171a] p-5 shadow-sm transition-all hover:border-amber-500/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Completed Job Order trend ({data.forecast.month || 'forecast'})
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {data.forecast.available
                      ? formatPeso(data.forecast.predicted_revenue)
                      : 'Not trained'}
                  </p>
                  <div className="mt-2 text-xs text-neutral-400">
                    {data.forecast.available
                      ? `Ordinary least-squares fit • trained ${data.forecast.trained_at ? new Date(data.forecast.trained_at).toLocaleDateString() : 'date unavailable'}`
                      : data.forecast.reason}
                  </div>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>
            </div>

            {/* Card 2: Quotation Conversion Rate */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#17171a] p-5 shadow-sm transition-all hover:border-emerald-500/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Proposal Win-Rate
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {data.quotation_performance.conversion_rate === null ? '—' : `${data.quotation_performance.conversion_rate}%`}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span className="font-semibold text-emerald-400">
                      {data?.quotation_performance?.accepted ?? 0} won
                    </span>
                    <span>of {data?.quotation_performance?.total ?? 0} quotes</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-amber-400">{data?.quotation_performance?.under_review ?? 0} in review</span>
                  </div>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Target className="h-5 w-5" />
                </span>
              </div>
            </div>

            {/* Card 3: Fleet Utilization */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#17171a] p-5 shadow-sm transition-all hover:border-cyan-500/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Heavy Fleet Utilization
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {data.equipment_utilization.utilization_rate === null ? '—' : `${data.equipment_utilization.utilization_rate}%`}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span className="font-semibold text-cyan-400">
                      {data?.equipment_utilization?.rented ?? 0} deployed
                    </span>
                    <span>of {data?.equipment_utilization?.total ?? 0} units</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">{data?.equipment_utilization?.available ?? 0} ready</span>
                  </div>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <Truck className="h-5 w-5" />
                </span>
              </div>
            </div>

            {/* Card 4: Risk Mitigation Radar */}
            <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#17171a] p-5 shadow-sm transition-all hover:border-red-500/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Overdue & Lead Risk
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {data?.rental_trends?.overdue ?? 0} <span className="text-sm font-normal text-neutral-400">Overdue Units</span>
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {(data?.rental_trends?.overdue ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Action Required
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400">Zero Overdue</span>
                    )}
                    <span className="text-neutral-500">•</span>
                    <span className="text-amber-400">
                      {data?.customer_activity?.aging_inquiries ?? 0} aging leads
                    </span>
                  </div>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  (data?.rental_trends?.overdue ?? 0) > 0
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                }`}>
                  <ShieldAlert className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Completed revenue history and trained trend estimate */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Six-month completed Job Order history and optional OLS estimate */}
            <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 lg:col-span-2 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    Completed Job Order Values
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Monthly completed Job Order totals by completion date (last six months)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="h-3 w-3 rounded-sm bg-neutral-600" />
                    Completed
                  </span>
                  {data.forecast.available && (
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <span className="h-3 w-3 rounded-sm bg-amber-500" />
                      OLS trend estimate
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                {history.some((item) => item.amount > 0) ? (
                  <div className="flex h-64 items-end gap-3 sm:gap-4 border-b border-neutral-800 pb-4">
                    {/* Historical months */}
                    {history.map((item, index) => {
                      const heightPercent = item.amount > 0
                        ? Math.max((item.amount / maxRevenue) * 100, 4)
                        : 0;
                      return (
                        <div
                          key={item.month}
                          className="group relative flex h-full min-w-0 flex-1 flex-col justify-end items-center"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 z-20 hidden rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] text-white shadow-xl group-hover:block whitespace-nowrap">
                            <p className="font-semibold">{item.label}</p>
                            <p className="text-amber-400">{formatPeso(item.amount)}</p>
                            <p className="text-[10px] text-neutral-400">Completed Job Orders</p>
                          </div>

                          <span className="mb-2 text-[10px] font-medium text-neutral-400 text-center truncate max-w-full">
                            {formatPeso(item.amount).replace('PHP', '₱').replace('.00', '')}
                          </span>

                          <div className="w-full max-w-[48px] rounded-t-lg bg-neutral-800 overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                            <div
                              className="w-full bg-gradient-to-t from-neutral-700 to-neutral-500 transition-all duration-700 hover:from-neutral-600 hover:to-neutral-400 rounded-t-md"
                              style={{
                                height: `${heightPercent}%`,
                                transitionDelay: `${index * 60}ms`,
                              }}
                            />
                          </div>

                          <span className="mt-2 text-[11px] font-medium text-neutral-400 text-center">
                            {item.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}

                    {/* OLS trend estimate */}
                    {data?.forecast?.available && (
                      <div className="group relative flex h-full min-w-0 flex-1 flex-col justify-end items-center">
                        <div className="absolute -top-12 z-20 hidden rounded-lg border border-amber-500/50 bg-neutral-900 px-2.5 py-1 text-[11px] text-white shadow-xl group-hover:block whitespace-nowrap">
                          <p className="font-semibold text-amber-400">OLS trend estimate: {data.forecast.month}</p>
                          <p className="text-white font-bold">{formatPeso(data.forecast.predicted_revenue)}</p>
                          <p className="text-[10px] text-neutral-400">Method: {data.forecast.method?.replace(/_/g, ' ')}</p>
                        </div>

                        <span className="mb-2 text-[10px] font-bold text-amber-400 text-center truncate max-w-full">
                          {formatPeso(data.forecast.predicted_revenue).replace('PHP', '₱').replace('.00', '')}
                        </span>

                        <div className="w-full max-w-[48px] rounded-t-lg border-2 border-dashed border-amber-500/50 bg-amber-500/10 overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                          <div
                            className="w-full bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-700 rounded-t-md shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            style={{
                              height: `${data.forecast.predicted_revenue && data.forecast.predicted_revenue > 0
                                ? Math.max((data.forecast.predicted_revenue / maxRevenue) * 100, 4)
                                : 0}%`,
                            }}
                          />
                        </div>

                        <span className="mt-2 text-[11px] font-bold text-amber-400 text-center flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {data.forecast.month?.split(' ')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                    No completed Job Order values are available for the displayed months.
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                  Source: completed Job Order total_amount grouped by completion_date.
                </span>
                <span className="text-neutral-500">
                  Currency: Philippine Peso (PHP)
                </span>
              </div>
            </div>

            {/* Saved revenue trend model status */}
            <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Revenue Trend Model
                  </h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                    data.forecast.available
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400'
                  }`}>
                    {data.forecast.available ? 'Trained' : 'Not trained'}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs text-neutral-400">OLS estimate ({data.forecast.month || 'unavailable'})</p>
                    <p className="mt-1 text-2xl font-black text-amber-400">{data.forecast.available ? formatPeso(data.forecast.predicted_revenue) : '—'}</p>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Completed Job Orders:</span>
                      <strong className="text-emerald-400">{data?.job_orders?.completed ?? 0} completed</strong>
                    </div>
                    {data.forecast.available && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Training window:</span>
                          <strong className="text-white">{data.forecast.period_start} – {data.forecast.period_end}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Months with completed values:</span>
                          <strong className="text-white">{data.forecast.months_with_data} / {data.forecast.months_in_dataset}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Last trained:</span>
                          <strong className="text-white">{data.forecast.trained_at ? new Date(data.forecast.trained_at).toLocaleString() : '—'}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-300">Method and data source</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                      {data.forecast.available
                        ? `${data.forecast.method}. Trained from ${data.forecast.source}.`
                        : data.forecast.reason}
                    </p>
                  </div>
                  {trainingError && <p className="text-xs text-red-400" role="alert">{trainingError}</p>}
                  {trainingResult?.trained && (
                    <p className="text-xs text-emerald-400" role="status">
                      Model fitted and saved. Training period: {trainingResult.period_start} – {trainingResult.period_end}; {trainingResult.months_with_data} months contained completed Job Order values.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                {canTrainModel && (
                  <button
                    type="button"
                    onClick={handleTrainModel}
                    disabled={training}
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    {training ? 'Fitting model…' : 'Train Your AI'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Equipment status and category utilization */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Fleet Status Breakdown */}
            <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="h-4 w-4 text-cyan-400" />
                  Equipment Status
                </h3>
                <Link
                  href="/equipment/availability"
                  className="text-xs font-medium text-cyan-400 hover:underline"
                >
                  Yard Map →
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {/* Visual meter */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-neutral-400 mb-2">
                    <span>Utilization Rate</span>
                    <span className="font-bold text-white">{data?.equipment_utilization?.utilization_rate ?? 0}%</span>
                  </div>
                  <div className="h-3.5 w-full rounded-full bg-neutral-800 overflow-hidden flex">
                    <div
                      className="bg-cyan-500 transition-all duration-500"
                      style={{
                        width: `${data?.equipment_utilization?.total ? ((data.equipment_utilization.rented / data.equipment_utilization.total) * 100) : 0}%`,
                      }}
                      title="Rented"
                    />
                    <div
                      className="bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${data?.equipment_utilization?.total ? ((data.equipment_utilization.maintenance / data.equipment_utilization.total) * 100) : 0}%`,
                      }}
                      title="Maintenance"
                    />
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${data?.equipment_utilization?.total ? ((data.equipment_utilization.available / data.equipment_utilization.total) * 100) : 0}%`,
                      }}
                      title="Available"
                    />
                  </div>
                </div>

                {/* Fleet status legend */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-cyan-400">Rented</p>
                    <p className="mt-1 text-lg font-bold text-white">{data?.equipment_utilization?.rented ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-emerald-400">Available</p>
                    <p className="mt-1 text-lg font-bold text-white">{data?.equipment_utilization?.available ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-amber-400">In Service</p>
                    <p className="mt-1 text-lg font-bold text-white">{data?.equipment_utilization?.maintenance ?? 0}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-400 space-y-1">
                  <p className="flex justify-between">
                    <span>Total Heavy Machinery:</span>
                    <strong className="text-white">{data?.equipment_utilization?.total ?? 0} units</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Ready for Deployment:</span>
                    <strong className="text-emerald-400">{data?.equipment_utilization?.available ?? 0} units</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 lg:col-span-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  Machinery Category Utilization Breakdown
                </h3>
                <span className="text-xs text-neutral-400">Active vs Total by Machine Class</span>
              </div>

              <div className="mt-5 space-y-4">
                {data?.equipment_utilization?.categories && data.equipment_utilization.categories.length > 0 ? (
                  data.equipment_utilization.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-200">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">
                            {cat.rented} of {cat.total} deployed
                          </span>
                          <span className="font-bold text-amber-400">{cat.rate}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(cat.rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500 py-8 text-center">
                    No equipment category classifications found.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Overdue rentals */}
          <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  Rental Overdue & Risk Mitigation Radar
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Active rentals with scheduled end dates before today
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  (data?.rental_trends?.overdue ?? 0) > 0
                    ? 'border border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                }`}>
                  {(data?.rental_trends?.overdue ?? 0) > 0
                    ? `${data?.rental_trends?.overdue} overdue rentals`
                    : 'No overdue rentals'}
                </span>
                <Link
                  href="/rentals"
                  className="rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                >
                  All Rentals →
                </Link>
              </div>
            </div>

            <div className="mt-5">
              {data?.rental_trends?.overdue_items && data.rental_trends.overdue_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="pb-3 font-semibold">Rental #</th>
                        <th className="pb-3 font-semibold">Equipment Name</th>
                        <th className="pb-3 font-semibold">Scheduled Return</th>
                        <th className="pb-3 font-semibold text-center">Days Overdue</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {data.rental_trends.overdue_items.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-800/30 transition">
                          <td className="py-3.5 font-mono font-semibold text-amber-400">
                            {item.rental_number}
                          </td>
                          <td className="py-3.5 font-medium text-white">
                            {item.equipment_name}
                          </td>
                          <td className="py-3.5 text-neutral-400">
                            {item.rental_end_date}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="inline-flex items-center rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                              {item.days_overdue} days
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-2">
                            <Link
                              href={`/rentals`}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition"
                            >
                              Resolve
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">No Overdue Deployments Detected</h4>
                  <p className="mt-1 text-xs text-neutral-400 max-w-md">
                    All currently dispatched equipment units are operating within agreed rental durations. The risk mitigation radar is stable.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Data-driven operational indicators */}
          <div className="rounded-2xl border border-neutral-800 bg-[#17171a] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Operational Indicators
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Prioritized algorithmic actions to boost conversion, protect fleet margins, and resolve bottlenecks
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-300 font-medium">
                {data?.recommendations?.length ?? 0} Indicators
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.recommendations && data.recommendations.length > 0 ? (
                data.recommendations.map((rec) => {
                  const isHigh = rec.priority === 'high';
                  const isOpportunity = rec.priority === 'opportunity';
                  const isOptimal = rec.priority === 'optimal';

                  return (
                    <div
                      key={rec.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 ${
                        isHigh
                          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                          : isOpportunity
                          ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                          : isOptimal
                          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                          : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isHigh
                                ? 'bg-red-500/20 text-red-400'
                                : isOpportunity
                                ? 'bg-amber-500/20 text-amber-400'
                                : isOptimal
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {rec.badge}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                            Priority: {rec.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                        <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                          {rec.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-neutral-800/60">
                        <Link
                          href={rec.action_href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
                        >
                          <span>{rec.action_label}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-6 text-center text-xs text-neutral-500">
                  No indicators meet the current data thresholds.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Interactive Executive AI Copilot Chatbot */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#1c1a16] via-[#161618] to-[#121214] p-5 sm:p-6 shadow-xl">
            {/* Chat Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    IntelliTrack AI Copilot
                    <span className={`flex h-2 w-2 rounded-full ${data.ai_assistant_available ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {data.ai_assistant_available
                      ? 'Server-configured AI provider • Business data context'
                      : 'AI provider is not configured on the server'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleClearChat}
                  title="Clear Chat History"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-700 hover:text-white transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Chatbot Message Thread Window */}
            <div className="mt-4 flex flex-col h-[440px] rounded-xl border border-neutral-800 bg-neutral-950/90 shadow-inner overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 mt-1">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isUser
                            ? 'items-end'
                            : 'items-start max-w-[92%] sm:max-w-[85%]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-neutral-400">
                            {isUser ? 'You' : 'IntelliTrack Copilot'}
                          </span>
                          {msg.source && (
                            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.2 text-[9px] text-amber-400">
                              {msg.source}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-500">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isUser
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-xs'
                              : 'bg-[#18181b] border border-neutral-800 text-neutral-200 rounded-tl-xs shadow-md'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <CopilotResponseRenderer content={msg.text} />
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 mt-1">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {copilotLoading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 mt-1 animate-pulse">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-xs border border-neutral-800 bg-[#18181b] px-4 py-3 shadow-md">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-xs text-neutral-400 ml-2">Copilot is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions within chat */}
              <div className="border-t border-neutral-800/80 bg-neutral-900/50 p-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 shrink-0">Suggestions:</span>
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopilotSubmit(qp)}
                      disabled={copilotLoading || !data.ai_assistant_available}
                      className="shrink-0 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-amber-500/50 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
                    >
                      💬 {qp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !copilotLoading) {
                    handleCopilotSubmit();
                  }
                }}
                placeholder="Ask about current business records or the trained revenue trend..."
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={() => handleCopilotSubmit()}
                disabled={copilotLoading || !prompt.trim() || !data.ai_assistant_available}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500 px-5 py-3 text-sm font-bold text-neutral-950 shadow-md transition hover:bg-amber-400 disabled:opacity-50"
              >
                {copilotLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
};

export default AiAnalytics;