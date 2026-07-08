import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

const STEPS = ['Metadata', 'Test Cases', 'Constraints', 'Preview & Publish'];

const EMPTY_TEST_CASE = { input: '', expected_output: '', is_hidden: false };

const difficultyOptions = [
  { value: 'easy',   label: 'Easy',   desc: 'Beginner-friendly, straightforward logic', color: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'medium', label: 'Medium', desc: 'Requires problem-solving and planning',     color: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
  { value: 'hard',   label: 'Hard',   desc: 'Advanced algorithms and data structures',  color: 'border-red-300 bg-red-50 text-red-800' },
];

export default function ChallengeBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  const [meta, setMeta] = useState({
    title: '', description: '', difficulty: '', time_limit: 30,
  });

  const [testCases, setTestCases] = useState([{ ...EMPTY_TEST_CASE }]);
  const [constraints, setConstraints] = useState('');
  const [publish, setPublish] = useState(false);

  // ── Validation per step ──────────────────────────────────────
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!meta.title.trim())       e.title       = 'Title is required.';
      if (!meta.description.trim()) e.description = 'Description is required.';
      if (!meta.difficulty)         e.difficulty  = 'Please select a difficulty.';
      if (meta.time_limit < 5 || meta.time_limit > 300)
        e.time_limit = 'Time limit must be between 5 and 300 seconds.';
    }
    if (step === 1) {
      testCases.forEach((tc, i) => {
        if (!tc.input.trim())           e[`tc_input_${i}`]  = `Case ${i+1}: input is required.`;
        if (!tc.expected_output.trim()) e[`tc_output_${i}`] = `Case ${i+1}: expected output is required.`;
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  // ── Test case helpers ────────────────────────────────────────
  const addTestCase = () => setTestCases(t => [...t, { ...EMPTY_TEST_CASE }]);

  const removeTestCase = (i) =>
    setTestCases(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t);

  const updateTestCase = (i, field, value) =>
    setTestCases(t => t.map((tc, idx) => idx === i ? { ...tc, [field]: value } : tc));

  // ── Submit ───────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      const fullDescription = constraints.trim()
        ? `${meta.description}\n\n**Constraints:**\n${constraints}`
        : meta.description;

      const res = await api.post('/challenges', {
        title:        meta.title,
        description:  fullDescription,
        difficulty:   meta.difficulty,
        time_limit:   meta.time_limit,
        is_published: publish,
      });

      const challengeId = res.data.id;

      await Promise.all(testCases.map(tc =>
        api.post(`/challenges/${challengeId}/test-cases`, tc)
      ));

      return challengeId;
    },
    onSuccess: (id) => navigate(`/challenges/${id}`),
  });

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">New Challenge</h1>
        <p className="text-gray-500 text-sm">Fill in each step — you can go back at any time.</p>
      </div>

      {/* Step progress bar */}
      <div className="mb-8">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className="flex flex-col items-center gap-1 group flex-shrink-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                  ${i < step  ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700' :
                    i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                 'bg-gray-100 text-gray-400 cursor-default'}`}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">

        {/* ── Step 0: Metadata ──────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Challenge details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={meta.title}
                onChange={e => setMeta({ ...meta, title: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="e.g. Two Sum"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                rows={5}
                value={meta.description}
                onChange={e => setMeta({ ...meta, description: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Describe the problem clearly. What is the input? What should the output be?"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {difficultyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMeta({ ...meta, difficulty: opt.value })}
                    className={`border-2 rounded-xl p-3 text-left transition-all
                      ${meta.difficulty === opt.value ? opt.color + ' border-opacity-100' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-sm mb-0.5">{opt.label}</div>
                    <div className="text-xs opacity-70 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
              {errors.difficulty && <p className="text-red-500 text-xs mt-1">{errors.difficulty}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Time limit: <span className="text-blue-600 font-semibold">{meta.time_limit}s</span>
              </label>
              <input
                type="range"
                min={5} max={300} step={5}
                value={meta.time_limit}
                onChange={e => setMeta({ ...meta, time_limit: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5s (fast)</span>
                <span>300s (extended)</span>
              </div>
              {errors.time_limit && <p className="text-red-500 text-xs mt-1">{errors.time_limit}</p>}
            </div>
          </div>
        )}

        {/* ── Step 1: Test Cases ────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Test cases</h2>
                <p className="text-sm text-gray-500 mt-0.5">Hidden test cases prevent hardcoded answers.</p>
              </div>
              <button
                onClick={addTestCase}
                className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add case
              </button>
            </div>

            <div className="space-y-4">
              {testCases.map((tc, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Case {i + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => updateTestCase(i, 'is_hidden', !tc.is_hidden)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0
                            ${tc.is_hidden ? 'bg-purple-500' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                            ${tc.is_hidden ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-xs text-gray-500">
                          {tc.is_hidden ? 'Hidden' : 'Visible'}
                        </span>
                      </label>
                      {testCases.length > 1 && (
                        <button
                          onClick={() => removeTestCase(i)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Input</label>
                      <textarea
                        rows={3}
                        value={tc.input}
                        onChange={e => updateTestCase(i, 'input', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                          ${errors[`tc_input_${i}`] ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="1 2"
                      />
                      {errors[`tc_input_${i}`] && (
                        <p className="text-red-500 text-xs mt-0.5">{errors[`tc_input_${i}`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Expected output</label>
                      <textarea
                        rows={3}
                        value={tc.expected_output}
                        onChange={e => updateTestCase(i, 'expected_output', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                          ${errors[`tc_output_${i}`] ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="3"
                      />
                      {errors[`tc_output_${i}`] && (
                        <p className="text-red-500 text-xs mt-0.5">{errors[`tc_output_${i}`]}</p>
                      )}
                    </div>
                  </div>

                  {tc.is_hidden && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                      Users won't see this test case
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Constraints ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Constraints</h2>
              <p className="text-sm text-gray-500 mt-0.5">Optional — add input boundaries and rules.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Constraints</label>
              <textarea
                rows={6}
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder={`1 <= n <= 10^5\n-10^9 <= a, b <= 10^9\nInput is always valid`}
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <strong>Tip:</strong> Good constraints help users understand the expected scale and avoid edge case confusion.
            </div>
          </div>
        )}

        {/* ── Step 3: Preview & Publish ─────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Preview & publish</h2>

            {/* Preview card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{meta.title}</h3>
                <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0
                  ${meta.difficulty === 'easy'   ? 'bg-green-100 text-green-700' :
                    meta.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                   'bg-red-100 text-red-700'}`}>
                  {meta.difficulty}
                </span>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                {meta.description}
              </p>
              {constraints && (
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Constraints</div>
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{constraints}</pre>
                </div>
              )}
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>⏱ {meta.time_limit}s limit</span>
                <span>🧪 {testCases.length} test case{testCases.length !== 1 ? 's' : ''} ({testCases.filter(t => t.is_hidden).length} hidden)</span>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 text-sm">Publish immediately</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {publish ? 'Challenge will be visible to all users.' : 'Saved as draft — only you can see it.'}
                </div>
              </div>
              <div
                onClick={() => setPublish(p => !p)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0
                  ${publish ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${publish ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {/* Submit error */}
            {submitMutation.isError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {submitMutation.error?.response?.data?.message || 'Failed to create challenge.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <div className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</div>

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Creating...
              </>
            ) : publish ? 'Publish challenge' : 'Save as draft'}
          </button>
        )}
      </div>
    </div>
  );
}