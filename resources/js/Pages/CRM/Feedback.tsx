import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody } from '../../Components/Card';
import Button from '../../Components/Button';
import { Input } from '../../Components/Form';
import Modal from '../../Components/Modal';
import CrmNavTabs from '../../Components/CrmNavTabs';
import {
  Plus,
  Search,
  Star,
  Truck,
  UserCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface Feedback {
  id: number;
  customer_id: number;
  overall_rating: number;
  equipment_condition_rating?: number;
  operator_competence_rating?: number;
  timeliness_rating?: number;
  comments?: string;
  status: 'published' | 'under_review' | 'addressed';
  action_taken?: string;
  created_at: string;
  customer?: { id: number; name: string; company_name?: string };
  jobOrder?: { id: number; job_number: string; description: string };
  rental?: { id: number; rental_number: string };
  creator?: { id: number; name: string };
}

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; company_name?: string }>>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    customer_id: '',
    job_order_id: '',
    overall_rating: 5,
    equipment_condition_rating: 5,
    operator_competence_rating: 5,
    timeliness_rating: 5,
    comments: '',
    action_taken: '',
  });

  const loadFeedback = () => {
    setLoading(true);
    const query = new URLSearchParams({
      per_page: '100',
      ...(search ? { search } : {}),
      ...(ratingFilter !== 'all' ? { rating: ratingFilter } : {}),
    });

    fetch(`/api/crm/feedback?${query}`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setFeedbacks(data.data ?? []))
      .catch(() => setFeedbacks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeedback();
  }, [search, ratingFilter]);

  useEffect(() => {
    fetch('/api/customers?per_page=100', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCustomers(data.data ?? []))
      .catch(() => {});

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const customerId = params.get('customer_id');
      const jobOrderId = params.get('job_order_id');
      if (customerId || jobOrderId || params.get('create') === 'true') {
        setIsModalOpen(true);
        setNewFeedback((prev) => ({
          ...prev,
          ...(customerId ? { customer_id: customerId } : {}),
          ...(jobOrderId ? { job_order_id: jobOrderId } : {}),
        }));
      }
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    try {
      const res = await fetch('/api/crm/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(newFeedback),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setMessage('Customer feedback recorded successfully.');
        setNewFeedback({
          customer_id: '',
          job_order_id: '',
          overall_rating: 5,
          equipment_condition_rating: 5,
          operator_competence_rating: 5,
          timeliness_rating: 5,
          comments: '',
          action_taken: '',
        });
        loadFeedback();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to record customer feedback.');
    } finally {
      setSaving(false);
    }
  };

  // Compute satisfaction averages
  const avgOverall = feedbacks.length
    ? (feedbacks.reduce((acc, curr) => acc + curr.overall_rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const avgEquip = feedbacks.length
    ? (feedbacks.reduce((acc, curr) => acc + (curr.equipment_condition_rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const avgOperator = feedbacks.length
    ? (feedbacks.reduce((acc, curr) => acc + (curr.operator_competence_rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const avgTime = feedbacks.length
    ? (feedbacks.reduce((acc, curr) => acc + (curr.timeliness_rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={clsx(
              'h-4 w-4',
              i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Head title="Client Satisfaction & Service Feedback - CRM" />
      <AppLayout dark={true} title="CRM & Client Management">
        <div className="space-y-5">
          <CrmNavTabs
            actionButton={
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Record Feedback
              </Button>
            }
          />

          {message && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-sm">
              {message}
            </div>
          )}

          {/* CSAT Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Overall CSAT Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-400">{avgOverall}</span>
                  <span className="text-xs text-content-muted">/ 5.0</span>
                </div>
              </div>
              <Sparkles className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Equipment Reliability</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{avgEquip}</span>
                  <span className="text-xs text-content-muted">/ 5.0</span>
                </div>
              </div>
              <Truck className="h-8 w-8 text-emerald-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">Operator Competence</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-400">{avgOperator}</span>
                  <span className="text-xs text-content-muted">/ 5.0</span>
                </div>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-surface-card border border-border-default flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-secondary uppercase">On-Time Mobilization</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-purple-400">{avgTime}</span>
                  <span className="text-xs text-content-muted">/ 5.0</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-purple-500/40" />
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Search feedback comments, client name..."
                  startIcon={<Search className="h-4 w-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Star Ratings</option>
                  <option value="5">5 Stars (Excellent)</option>
                  <option value="4">4 Stars (Good)</option>
                  <option value="3">3 Stars (Average)</option>
                  <option value="2">2 Stars (Needs Improvement)</option>
                  <option value="1">1 Star (Poor)</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Feedbacks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb) => (
              <Card key={fb.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-base text-content-primary">
                        {fb.customer?.company_name || fb.customer?.name || 'Anonymous Client'}
                      </p>
                      <span className="text-xs text-content-muted">
                        Recorded on {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {renderStars(fb.overall_rating)}
                  </div>

                  {fb.comments && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-elevated/60 border border-border-default text-sm text-content-secondary italic">
                      "{fb.comments}"
                    </div>
                  )}

                  {/* Sub-ratings */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border-default/60 pt-3 text-xs text-content-secondary">
                    <div>
                      <span className="text-content-muted block">Machine:</span>
                      <strong className="text-content-primary font-bold">
                        {fb.equipment_condition_rating || 5} ★
                      </strong>
                    </div>
                    <div>
                      <span className="text-content-muted block">Operator:</span>
                      <strong className="text-content-primary font-bold">
                        {fb.operator_competence_rating || 5} ★
                      </strong>
                    </div>
                    <div>
                      <span className="text-content-muted block">Timeliness:</span>
                      <strong className="text-content-primary font-bold">
                        {fb.timeliness_rating || 5} ★
                      </strong>
                    </div>
                  </div>

                  {fb.action_taken && (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      <strong>Resolution / Action:</strong> {fb.action_taken}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {feedbacks.length === 0 && !loading && (
            <div className="py-12 text-center text-sm text-content-secondary bg-surface-card rounded-2xl border border-border-default">
              No customer feedback recorded yet. Click 'Record Feedback' to input post-rental client evaluations.
            </div>
          )}

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !saving && setIsModalOpen(false)}
            title="Record Client Satisfaction / Feedback"
            size="lg"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="feedback-form" loading={saving}>
                  Save Feedback
                </Button>
              </div>
            }
          >
            <form id="feedback-form" onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client / Company *
                </label>
                <select
                  required
                  value={newFeedback.customer_id}
                  onChange={(e) => setNewFeedback({ ...newFeedback, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Client Account</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Overall (1-5) *
                  </label>
                  <select
                    value={newFeedback.overall_rating}
                    onChange={(e) => setNewFeedback({ ...newFeedback, overall_rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Terrible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Equipment (1-5)
                  </label>
                  <select
                    value={newFeedback.equipment_condition_rating}
                    onChange={(e) => setNewFeedback({ ...newFeedback, equipment_condition_rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Operator (1-5)
                  </label>
                  <select
                    value={newFeedback.operator_competence_rating}
                    onChange={(e) => setNewFeedback({ ...newFeedback, operator_competence_rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                    Timeliness (1-5)
                  </label>
                  <select
                    value={newFeedback.timeliness_rating}
                    onChange={(e) => setNewFeedback({ ...newFeedback, timeliness_rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Client Evaluation & Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="Feedback on crane lifting performance, rigging safety, coordination with site engineers..."
                  value={newFeedback.comments}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary uppercase mb-1">
                  Action Taken / Management Follow-Up
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conducted maintenance check on boom cylinder; commended operator Marcus"
                  value={newFeedback.action_taken}
                  onChange={(e) => setNewFeedback({ ...newFeedback, action_taken: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default bg-surface-input text-content-primary rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </>
  );
};

export default FeedbackPage;
