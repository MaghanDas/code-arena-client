import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const difficultyConfig = {
  easy:   { label: 'Easy',   class: 'bg-green-50 text-green-700' },
  medium: { label: 'Medium', class: 'bg-yellow-50 text-yellow-700' },
  hard:   { label: 'Hard',   class: 'bg-red-50 text-red-700' },
};

// const LANGUAGE_STARTERS = {
//   javascript: '// Write your solution here\nfunction solution(input) {\n  \n}\n',
//   python:     '# Write your solution here\ndef solution(input):\n    pass\n',
//   php:        '<?php\n// Write your solution here\nfunction solution($input) {\n  \n}\n',
// };

const LANGUAGE_STARTERS = {
  javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
// Parse your input from 'lines' array
// Example for two numbers: const [a, b] = lines[0].split(' ').map(Number);

console.log("your answer here");
`,
  python: `import sys
input_data = sys.stdin.read().split()
# Parse your input from input_data
# Example for two numbers: a, b = int(input_data[0]), int(input_data[1])

print("your answer here")
`,
  php: `<?php
$input = trim(file_get_contents("php://stdin"));
$parts = explode(" ", $input);
// Parse your input from $parts
// Example for two numbers: [$a, $b] = array_map('intval', $parts);

echo "your answer here";
`,
};

export default function ChallengeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get('contest');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [language, setLanguage]     = useState('javascript');
  const [code, setCode]             = useState(LANGUAGE_STARTERS.javascript);
//   const [testOutputs, setTestOutputs] = useState({});
  const [verdict, setVerdict]       = useState(null);
  const [activeTab, setActiveTab]   = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => api.get(`/challenges/${id}`).then(r => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => api.post(`/challenges/${id}/submissions`, payload).then(r => r.data),
    onSuccess: (data) => {
      setVerdict(data);

      if (data.status === 'accepted') {
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
        setTimeout(() => {
          if (contestId) {
            navigate(`/contests/${contestId}`);
          } else {
            navigate('/');
          }
        }, 700);
      }
    },
    onError: (err) => setVerdict({ error: err.response?.data?.message || 'Submission failed.' }),
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(LANGUAGE_STARTERS[lang]);
    setVerdict(null);
  };

//   const handleSubmit = () => {
//     if (!isLoggedIn) { navigate('/login'); return; }
//     setVerdict(null);
//     submitMutation.mutate({ code, language, test_outputs: testOutputs });
//   };
const handleSubmit = () => {
  if (!isLoggedIn) { navigate('/login'); return; }
  setVerdict(null);
  const payload = contestId ? { code, language, contest_id: Number(contestId) } : { code, language };
  submitMutation.mutate(payload);
};
  if (isLoading) return <DetailSkeleton />;
  if (isError)   return <div className="text-center py-20 text-red-500">Challenge not found.</div>;

  const { challenge, test_cases: testCases = [] } = data;
  const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.easy;
  const visibleCases = testCases.filter(tc => !tc.is_hidden);

  return (
    <div className="h-[calc(100vh-80px)] flex gap-0 -mx-4 -my-8">

      {/* ── Left pane: description ─────────────────────────── */}
      <div className="w-[45%] border-r border-gray-200 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">

          {/* Title + badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{challenge.title}</h1>
            <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${diff.class}`}>
              {diff.label}
            </span>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap leading-relaxed">
            {challenge.description}
          </div>

          {/* Example test cases */}
          {visibleCases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Examples</h3>
              <div className="space-y-3">
                {visibleCases.map((tc, i) => (
                  <div key={tc.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="text-xs font-medium text-gray-400 mb-2">Example {i + 1}</div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Input</span>
                        <pre className="mt-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 font-mono text-gray-800 overflow-x-auto">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Expected output</span>
                        <pre className="mt-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 font-mono text-gray-800 overflow-x-auto">{tc.expected_output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time limit */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time limit: {challenge.time_limit}s
          </div>
        </div>
      </div>

      {/* ── Right pane: editor ────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">

        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
          </select>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition-colors"
          >
            {submitMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Judging...
              </>
            ) : 'Submit'}
          </button>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={val => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* ── Verdict panel ─────────────────────────────── */}
    {verdict && (
  <div className="border-t border-gray-700 bg-gray-850 max-h-64 overflow-y-auto">
    {verdict.error ? (
      <div className="p-4 text-red-400 text-sm font-mono whitespace-pre-wrap">{verdict.error}</div>
    ) : (
      <>
        {/* Status banner */}
        <div className={`px-4 py-3 flex items-center gap-3 border-b border-gray-700
          ${verdict.status === 'accepted' ? 'bg-green-900/40' :
            verdict.status === 'tle'      ? 'bg-orange-900/40' : 'bg-red-900/40'}`}>
          <span className={`text-base font-bold
            ${verdict.status === 'accepted' ? 'text-green-400' :
              verdict.status === 'tle'      ? 'text-orange-400' : 'text-red-400'}`}>
            {verdict.status === 'accepted' ? '✓ Accepted' :
             verdict.status === 'tle'      ? '⏱ Time Limit Exceeded' : '✗ Wrong Answer'}
          </span>
          <span className="text-gray-400 text-sm ml-auto">{verdict.runtime_ms}ms</span>
          {verdict.status === 'accepted' && (
            <span className="text-green-400 text-sm font-medium">+{verdict.score} pts</span>
          )}
        </div>

        {/* Runtime error per test case */}
        {verdict.results?.some(r => r.error) && (
          <div className="p-4">
            <div className="text-xs text-red-400 font-medium mb-2">Runtime error</div>
            <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap bg-red-900/20 rounded-lg p-3">
              {verdict.results.find(r => r.error)?.error}
            </pre>
          </div>
        )}

        {/* Per test-case results */}
        <div className="p-4">
          <div className="text-xs text-gray-400 mb-2 font-medium">Test case results</div>
          <div className="space-y-3">
            {verdict.results?.filter(r => !r.is_hidden).map((result, i) => (
              <div key={result.test_case_id} className={`rounded-lg border p-3 text-xs
                ${result.passed ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                    {result.passed ? '✓' : '✗'} Case {i + 1}
                  </span>
                </div>
                {!result.passed && !result.error && (
                  <div className="space-y-1 font-mono">
                    <div><span className="text-gray-500">Input:    </span><code className="text-gray-300">{result.input}</code></div>
                    <div><span className="text-gray-500">Expected: </span><code className="text-gray-300">{result.expected}</code></div>
                    <div><span className="text-gray-500">Got:      </span><code className="text-red-300">{result.got || '(empty)'}</code></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {verdict.results?.filter(r => r.is_hidden).length > 0 && (
            <div className="text-xs text-gray-500 mt-3">
              + {verdict.results.filter(r => r.is_hidden).length} hidden test case(s):&nbsp;
              {verdict.results.filter(r => r.is_hidden).every(r => r.passed)
                ? <span className="text-green-400">all passed</span>
                : <span className="text-red-400">some failed</span>}
            </div>
          )}
        </div>
      </>
    )}
  </div>
)}

        {/* Test output entry area (for submitting answers) */}
        {/* {!verdict && visibleCases.length > 0 && (
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <p className="text-xs text-gray-400 mb-3">
              Enter your expected output for each visible test case before submitting:
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {visibleCases.map((tc, i) => (
                <div key={tc.id} className="flex-shrink-0 w-48">
                  <div className="text-xs text-gray-500 mb-1">Case {i + 1} output</div>
                  <textarea
                    rows={2}
                    value={testOutputs[tc.id] || ''}
                    onChange={e => setTestOutputs({ ...testOutputs, [tc.id]: e.target.value })}
                    placeholder="Your output..."
                    className="w-full bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 px-2 py-1.5 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )} */}
        
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="h-[calc(100vh-80px)] flex gap-0 -mx-4 -my-8 animate-pulse">
      <div className="w-[45%] border-r border-gray-200 p-6">
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-5/6 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
      <div className="flex-1 bg-gray-900" />
    </div>
  );
}