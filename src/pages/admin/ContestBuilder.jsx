import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

const difficultyOptions = [
  { value: 'easy', label: 'Easy', desc: 'Straightforward logic', color: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'medium', label: 'Medium', desc: 'Requires planning', color: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
  { value: 'hard', label: 'Hard', desc: 'Advanced algorithms', color: 'border-red-300 bg-red-50 text-red-800' },
];

const createEmptyTestCase = () => ({
  input: '',
  expected_output: '',
  is_hidden: false,
});

const createEmptyChallenge = () => ({
  title: '',
  description: '',
  difficulty: '',
  time_limit: 30,
  testCases: [createEmptyTestCase()],
});

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ContestBuilder() {
  const navigate = useNavigate();
  const [contest, setContest] = useState({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
  });
  const [challenges, setChallenges] = useState([createEmptyChallenge()]);
  const [clientError, setClientError] = useState('');

  const addChallenge = () => {
    setChallenges(current => [...current, createEmptyChallenge()]);
  };

  const removeChallenge = (challengeIndex) => {
    setChallenges(current => current.length > 1
      ? current.filter((_, index) => index !== challengeIndex)
      : current
    );
  };

  const updateChallenge = (challengeIndex, field, value) => {
    setChallenges(current => current.map((challenge, index) => (
      index === challengeIndex ? { ...challenge, [field]: value } : challenge
    )));
  };

  const addTestCase = (challengeIndex) => {
    setChallenges(current => current.map((challenge, index) => (
      index === challengeIndex
        ? { ...challenge, testCases: [...challenge.testCases, createEmptyTestCase()] }
        : challenge
    )));
  };

  const removeTestCase = (challengeIndex, testCaseIndex) => {
    setChallenges(current => current.map((challenge, index) => {
      if (index !== challengeIndex) return challenge;

      return challenge.testCases.length > 1
        ? {
            ...challenge,
            testCases: challenge.testCases.filter((_, idx) => idx !== testCaseIndex),
          }
        : challenge;
    }));
  };

  const updateTestCase = (challengeIndex, testCaseIndex, field, value) => {
    setChallenges(current => current.map((challenge, index) => {
      if (index !== challengeIndex) return challenge;

      return {
        ...challenge,
        testCases: challenge.testCases.map((testCase, idx) => (
          idx === testCaseIndex ? { ...testCase, [field]: value } : testCase
        )),
      };
    }));
  };

  const validate = () => {
    if (!contest.title.trim()) return 'Contest title is required.';
    if (!contest.starts_at) return 'Contest start time is required.';
    if (!contest.ends_at) return 'Contest end time is required.';
    if (new Date(contest.ends_at) <= new Date(contest.starts_at)) {
      return 'Contest end time must be after the start time.';
    }

    if (challenges.length === 0) {
      return 'Add at least one challenge.';
    }

    for (let challengeIndex = 0; challengeIndex < challenges.length; challengeIndex += 1) {
      const challenge = challenges[challengeIndex];

      if (!challenge.title.trim()) return `Challenge ${challengeIndex + 1}: title is required.`;
      if (!challenge.description.trim()) return `Challenge ${challengeIndex + 1}: description is required.`;
      if (!challenge.difficulty) return `Challenge ${challengeIndex + 1}: select a difficulty.`;
      if (challenge.time_limit < 5 || challenge.time_limit > 300) {
        return `Challenge ${challengeIndex + 1}: time limit must be between 5 and 300 seconds.`;
      }
      if (challenge.testCases.length === 0) {
        return `Challenge ${challengeIndex + 1}: add at least one test case.`;
      }

      for (let testCaseIndex = 0; testCaseIndex < challenge.testCases.length; testCaseIndex += 1) {
        const testCase = challenge.testCases[testCaseIndex];
        if (!testCase.input.trim()) {
          return `Challenge ${challengeIndex + 1}, case ${testCaseIndex + 1}: input is required.`;
        }
        if (!testCase.expected_output.trim()) {
          return `Challenge ${challengeIndex + 1}, case ${testCaseIndex + 1}: expected output is required.`;
        }
      }
    }

    return '';
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const createdChallengeIds = [];

      for (const challenge of challenges) {
        const challengeResponse = await api.post('/challenges', {
          title: challenge.title.trim(),
          description: challenge.description.trim(),
          difficulty: challenge.difficulty,
          time_limit: Number(challenge.time_limit),
          is_published: false,
        });

        const challengeId = challengeResponse.data.id;
        createdChallengeIds.push(challengeId);

        await Promise.all(challenge.testCases.map(testCase => (
          api.post(`/challenges/${challengeId}/test-cases`, {
            input: testCase.input,
            expected_output: testCase.expected_output,
            is_hidden: testCase.is_hidden,
          })
        )));
      }

      const contestResponse = await api.post('/contests', {
        title: contest.title.trim(),
        description: contest.description.trim() || null,
        starts_at: new Date(contest.starts_at).toISOString(),
        ends_at: new Date(contest.ends_at).toISOString(),
        challenge_ids: createdChallengeIds,
      });

      return contestResponse.data;
    },
    onSuccess: (createdContest) => navigate(`/contests/${createdContest.id}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validate();
    setClientError(error);

    if (error) return;

    submitMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">New Contest</h1>
        <p className="text-gray-500 text-sm">Create the contest schedule and its challenges in one pass.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-20">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contest details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Set the contest name and schedule.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={contest.title}
                onChange={e => setContest({ ...contest, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. June Weekly Contest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                rows={5}
                value={contest.description}
                onChange={e => setContest({ ...contest, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the contest format, scoring, or special rules."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Starts at</label>
                <input
                  type="datetime-local"
                  value={contest.starts_at}
                  onChange={e => setContest({ ...contest, starts_at: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ends at</label>
                <input
                  type="datetime-local"
                  value={contest.ends_at}
                  onChange={e => setContest({ ...contest, ends_at: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <strong>Note:</strong> challenges created here stay unpublished until you open them from the contest.
            </div>

            {clientError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {clientError}
              </div>
            )}

            {submitMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {submitMutation.error?.response?.data?.message || 'Failed to create contest.'}
              </div>
            )}

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {submitMutation.isPending ? 'Creating...' : 'Create contest'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Contest challenges</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Add the problems that belong to this contest.</p>
                </div>

                <button
                  type="button"
                  onClick={addChallenge}
                  className="inline-flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add challenge
                </button>
              </div>

              <div className="space-y-4">
                {challenges.map((challenge, challengeIndex) => (
                  <div key={challengeIndex} className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Challenge {challengeIndex + 1}</span>
                        <p className="text-xs text-gray-400 mt-0.5">Published automatically as part of this contest.</p>
                      </div>

                      {challenges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChallenge(challengeIndex)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                          <input
                            type="text"
                            value={challenge.title}
                            onChange={e => updateChallenge(challengeIndex, 'title', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Sum the Numbers"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                          <textarea
                            rows={5}
                            value={challenge.description}
                            onChange={e => updateChallenge(challengeIndex, 'description', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Describe the challenge clearly."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                          <div className="grid grid-cols-3 gap-2">
                            {difficultyOptions.map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateChallenge(challengeIndex, 'difficulty', option.value)}
                                className={`border-2 rounded-xl p-3 text-left transition-all ${challenge.difficulty === option.value ? option.color + ' border-opacity-100' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <div className="font-semibold text-sm mb-0.5">{option.label}</div>
                                <div className="text-xs opacity-70 leading-tight">{option.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Time limit: <span className="text-blue-600 font-semibold">{challenge.time_limit}s</span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={300}
                            step={5}
                            value={challenge.time_limit}
                            onChange={e => updateChallenge(challengeIndex, 'time_limit', Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>5s</span>
                            <span>300s</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Test cases</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Each test case needs input and expected output.</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => addTestCase(challengeIndex)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          + Add case
                        </button>
                      </div>

                      <div className="space-y-3">
                        {challenge.testCases.map((testCase, testCaseIndex) => (
                          <div key={testCaseIndex} className="border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-gray-600">Case {testCaseIndex + 1}</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => updateTestCase(challengeIndex, testCaseIndex, 'is_hidden', !testCase.is_hidden)}
                                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${testCase.is_hidden ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}
                                >
                                  {testCase.is_hidden ? 'Hidden' : 'Visible'}
                                </button>

                                {challenge.testCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTestCase(challengeIndex, testCaseIndex)}
                                    className="text-gray-300 hover:text-red-400 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Input</label>
                                <textarea
                                  rows={3}
                                  value={testCase.input}
                                  onChange={e => updateTestCase(challengeIndex, testCaseIndex, 'input', e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  placeholder="1 2"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Expected output</label>
                                <textarea
                                  rows={3}
                                  value={testCase.expected_output}
                                  onChange={e => updateTestCase(challengeIndex, testCaseIndex, 'expected_output', e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  placeholder="3"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500">Contest</div>
                  <div className="text-sm font-medium text-gray-900">{contest.title || 'Untitled contest'}</div>
                  <div className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                    {contest.description || 'No description yet.'}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>Starts: {formatDate(contest.starts_at)}</div>
                  <div>Ends: {formatDate(contest.ends_at)}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500">Challenges</div>
                  <div className="text-sm text-gray-700">
                    {challenges.length} challenge{challenges.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}