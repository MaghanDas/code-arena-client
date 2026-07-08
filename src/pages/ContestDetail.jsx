import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function useCountdown(endsAt) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft('');
      return;
    }

    const tick = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return timeLeft;
}

function isActive(contest) {
  const now = new Date();
  return now >= new Date(contest.starts_at) && now <= new Date(contest.ends_at);
}

const diffBadge = {
  easy:   'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  hard:   'bg-red-50 text-red-700',
};

export default function ContestDetail() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => api.get(`/contests/${id}`).then(r => r.data),
  });

  // Live leaderboard — refetches every 5 seconds during active contest
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', id],
    queryFn: () => api.get(`/contests/${id}/leaderboard`).then(r => r.data),
    refetchInterval: contest && isActive(contest) ? 5000 : false,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.get('/submissions').then(r => r.data),
    enabled: isLoggedIn,
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/contests/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaderboard', id]);
      queryClient.invalidateQueries(['contest', id]);
    },
  });

  const timeLeft = useCountdown(contest?.ends_at);

  const handleJoin = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    joinMutation.mutate();
  };

  if (contestLoading) return <ContestSkeleton />;
  if (!contest) return <div className="text-center py-20 text-red-500">Contest not found.</div>;

  const active = isActive(contest);
  const challenges = contest.challenges || [];
  const completedInContest = new Set(
    submissions
      .filter(submission => submission.status === 'accepted' && String(submission.contest_id) === String(id))
      .map(submission => submission.challenge_id)
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{contest.title}</h1>
              <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0
                ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {active ? 'Live' : 'Ended'}
              </span>
            </div>
            {contest.description && (
              <p className="text-gray-500 text-sm mb-3">{contest.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Start: {formatDate(contest.starts_at)}</span>
              <span>End: {formatDate(contest.ends_at)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {/* Countdown */}
            {active && (
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                  {timeLeft}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">remaining</div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending || joinMutation.isSuccess}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {joinMutation.isSuccess ? '✓ Joined' :
               joinMutation.isPending ? 'Joining...' : 'Join Contest'}
            </button>
            {joinMutation.isError && (
              <p className="text-xs text-red-500">
                {joinMutation.error?.response?.data?.message || 'Could not join.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Challenges ({challenges.length})
          </h2>
          <div className="space-y-2">
            {challenges.length === 0 ? (
              <div className="text-gray-400 text-sm py-8 text-center">No challenges added yet.</div>
            ) : challenges.map((c, i) => (
              <Link
                key={c.id}
                to={`/challenges/${c.id}?contest=${id}`}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 transition-colors group"
              >
                <span className="text-gray-300 font-mono text-sm w-5">{i + 1}</span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-800 group-hover:text-blue-600 text-sm transition-colors truncate">
                    {c.title}
                  </span>
                  {completedInContest.has(c.id) && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                      Completed
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${diffBadge[c.difficulty] || diffBadge.easy}`}>
                  {c.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
            {active && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No participants yet. Be the first to join!
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">User</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.user?.id}
                      className={`border-b border-gray-50 last:border-0 transition-colors
                        ${i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-center">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                          <span className="text-gray-400 font-mono">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {entry.user?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600">
                        {entry.total_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContestSkeleton() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="bg-gray-100 rounded-2xl h-36 mb-6" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}