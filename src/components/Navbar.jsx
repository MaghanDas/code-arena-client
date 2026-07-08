import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { to: '/',        label: 'Challenges' },
    { to: '/contests', label: 'Contests' },
    ...(isAdmin ? [{ to: '/admin/challenges/create', label: '+ New Challenge', admin: true }] : []),
    ...(isAdmin ? [{ to: '/admin/contests/create', label: '+ New Contest', admin: true }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="text-blue-600 font-bold text-xl tracking-tight flex-shrink-0">
            CodeArena
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`text-sm font-medium transition-colors hover:text-blue-600
                  ${l.admin ? 'text-purple-600' : 'text-gray-600'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                  {user?.name}
                </Link>
                <button onClick={handleLogout}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Login</Link>
                <Link to="/register"
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 text-gray-500 hover:text-gray-900">
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-50
                  ${l.admin ? 'text-purple-600' : 'text-gray-700'}`}>
                {l.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {isLoggedIn ? (
                <>
                  <Link to="/profile" onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    {user?.name} — Profile
                  </Link>
                  <button onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}






// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Navbar() {
//   const { isLoggedIn, isAdmin, user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   return (
//     <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
//       <div className="flex items-center gap-8">
//         <Link to="/" className="text-blue-600 font-bold text-xl tracking-tight">
//           CodeArena
//         </Link>
//         <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
//           <Link to="/" className="hover:text-blue-600 transition-colors">Challenges</Link>
//           <Link to="/contests" className="hover:text-blue-600 transition-colors">Contests</Link>
//           {isAdmin && (
//             <Link to="/admin/challenges/create" className="hover:text-blue-600 transition-colors text-purple-600">
//               + New Challenge
//             </Link>
//           )}
//         </div>
//       </div>

//       <div className="flex items-center gap-3">
//         {isLoggedIn ? (
//           <>
//             <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
//               {user?.name}
//             </Link>
//             <button
//               onClick={handleLogout}
//               className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg transition-colors"
//             >
//               Logout
//             </button>
//           </>
//         ) : (
//           <>
//             <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
//               Login
//             </Link>
//             <Link to="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
//               Register
//             </Link>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// }