import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  accepted:     { label: 'Accepted',     class: 'bg-green-50 text-green-700' },
  wrong_answer: { label: 'Wrong Answer', class: 'bg-red-50 text-red-700' },
  pending:      { label: 'Pending',      class: 'bg-gray-100 text-gray-500' },
};

export default function Profile() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: authUser?.name || '', password: '', password_confirmation: '' });
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch('/profile', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setEditing(false);
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Update failed.');
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {};
    if (form.name && form.name !== authUser?.name) payload.name = form.name;
    if (form.password) {
      if (form.password !== form.password_confirmation) {
        setFormError('Passwords do not match.');
        return;
      }
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    if (Object.keys(payload).length === 0) { setEditing(false); return; }
    updateMutation.mutate(payload);
  };

  if (isLoading) return <ProfileSkeleton />;

  const { user, total_submissions, accepted, acceptance_rate, submissions = [] } = data;

  const stats = [
    { label: 'Total Submissions', value: total_submissions },
    { label: 'Accepted',          value: accepted },
    { label: 'Acceptance Rate',   value: `${acceptance_rate}%` },
    { label: 'Global Score',      value: user.score },
  ];

  return (
    <div className="max-w-3xl mx-auto">

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {user.role === 'admin' && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-4 py-1.5 rounded-lg transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleUpdate} className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New password (optional)</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank to keep current"
              />
            </div>
            {form.password && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={e => setForm({...form, password_confirmation: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submission history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Submission History</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No submissions yet. Solve a challenge!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Challenge</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Language</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Score</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Runtime</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const st = statusConfig[sub.status] || statusConfig.pending;
                  return (
                    <tr key={sub.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {sub.challenge?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{sub.language}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.class}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600 font-semibold">
                        {sub.score}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">
                        {sub.runtime_ms != null ? `${sub.runtime_ms}ms` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="bg-gray-100 rounded-2xl h-24 mb-6" />
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  );
}