import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const difficultyConfig = {
  easy:   { label: 'Easy',   class: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: 'Medium', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  hard:   { label: 'Hard',   class: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ChallengeList() {
  const [difficulty, setDifficulty] = useState('all');
  const { isLoggedIn } = useAuth();

  const { data: challenges = [], isLoading, isError } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/challenges').then(r => r.data),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.get('/submissions').then(r => r.data),
    enabled: isLoggedIn,
  });

  const completedChallengeIds = new Set(
    submissions
      .filter(submission => submission.status === 'accepted' && !submission.contest_id)
      .map(submission => submission.challenge_id)
  );

  const filtered = difficulty === 'all'
    ? challenges
    : challenges.filter(c => c.difficulty === difficulty);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Challenges</h1>
        <p className="text-gray-500">Pick a problem and start solving.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'easy', 'medium', 'hard'].map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize
              ${difficulty === d
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >
            {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} challenge{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Challenge cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No challenges found.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((challenge, i) => {
            const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.easy;
            return (
              <Link
                key={challenge.id}
                to={`/challenges/${challenge.id}`}
                className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center gap-4 hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <span className="text-gray-300 font-mono text-sm w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {challenge.title}
                    </h2>
                    {completedChallengeIds.has(challenge.id) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    by {challenge.author?.name ?? 'Admin'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${diff.class}`}>
                  {diff.label}
                </span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-8" />
      <div className="flex gap-2 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-gray-100 rounded-full" />)}
      </div>
      <div className="grid gap-3">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="text-center py-20">
      <p className="text-red-500 font-medium">Failed to load challenges.</p>
      <p className="text-gray-400 text-sm mt-1">Make sure the API server is running.</p>
    </div>
  );
}