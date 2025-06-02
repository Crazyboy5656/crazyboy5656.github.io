import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { APP_NAME } from '../constants';

const Navbar: React.FC = () => {
  const { olympiadSubject, setOlympiadSubject } = useAppContext();
  const location = useLocation();

  const navItems = [
    { path: '/onboarding', label: 'Dashboard', icon: AcademicCapIcon }, // Changed path to /onboarding
    { path: '/ai-solver', label: 'AI Solver', icon: PuzzlePieceIcon },
    { path: '/profile', label: 'Profile', icon: UserCircleIcon },
  ];

  const handleLogout = () => {
    setOlympiadSubject(null); // This will trigger redirect to onboarding & clear caches via AppContext
  };

  if (!olympiadSubject) return null; // Don't show navbar on onboarding

  return (
    <nav className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-white flex items-center">
              <AcademicCapIcon className="h-10 w-10 mr-3"/>
              <span className="font-bold text-2xl">{APP_NAME}</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center
                    ${(location.pathname === item.path || (item.path === '/onboarding' && location.pathname === '/')) // Highlight Dashboard if on actual dashboard page too
                      ? 'bg-primary-dark text-white' 
                      : 'text-blue-100 hover:bg-primary-light hover:text-white'}`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.label}
                </Link>
              ))}
               <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-primary-light hover:text-white flex items-center"
              >
                <LogoutIcon className="h-5 w-5 mr-2" />
                Change Subject
              </button>
            </div>
          </div>
          <div className="md:hidden flex items-center"> {/* Mobile menu button can be added here */}
             <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-primary-light hover:text-white flex items-center"
              >
                <LogoutIcon className="h-5 w-5 mr-1" />
              </button>
            <span className="text-white font-medium ml-2">{olympiadSubject}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Icons (Heroicons)
const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const PuzzlePieceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 6.75h.008v.008H12v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.215 12.81A4.504 4.504 0 016.75 10.5a4.5 4.5 0 013.465-4.31m0 8.62a4.5 4.5 0 000-8.62" />
 </svg>
);


export default Navbar;