import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function getContestStatus(contest) {
  const now = new Date();
  const start = new Date(contest.starts_at);
  const end = new Date(contest.ends_at);
  if (now < start) return { label: 'Upcoming', class: 'bg-blue-50 text-blue-700' };
  if (now > end)   return { label: 'Ended',    class: 'bg-gray-100 text-gray-500' };
  return { label: 'Live', class: 'bg-green-50 text-green-700' };
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ContestList() {
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: () => api.get('/contests').then(r => r.data),
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Contests</h1>
        <p className="text-gray-500">Compete live and climb the leaderboard.</p>
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No contests yet.</div>
      ) : (
        <div className="grid gap-4">
          {contests.map(contest => {
            const status = getContestStatus(contest);
            return (
              <Link
                key={contest.id}
                to={`/contests/${contest.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                    {contest.title}
                  </h2>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${status.class}`}>
                    {status.label}
                  </span>
                </div>
                {contest.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{contest.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Starts: {formatDate(contest.starts_at)}</span>
                  <span>Ends: {formatDate(contest.ends_at)}</span>
                  <span className="ml-auto">{contest.participants_count ?? 0} participants</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}