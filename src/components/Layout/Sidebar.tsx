import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  GitBranch, 
  Play, 
  Server, 
  Users, 
  Settings,
  Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Flows', href: '/flows', icon: GitBranch },
  { name: 'Executions', href: '/executions', icon: Play },
  { name: 'Applications', href: '/applications', icon: Server },
  { name: 'Users', href: '/users', icon: Users },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const { state } = useApp();
  const { theme } = state;

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out flex flex-col ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } border-r`}>
      <div className={`flex items-center h-16 px-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <Zap className="h-8 w-8 text-cyan-400 glow-icon" />
        {isOpen && (
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Orkestra
          </span>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                  : theme === 'dark' 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className={`h-5 w-5 ${isOpen ? 'mr-3' : 'mx-auto'} transition-transform group-hover:scale-110`} />
            {isOpen && item.name}
          </NavLink>
        ))}
      </nav>

      <div className={`border-t p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}>
          <Settings className={`h-5 w-5 ${isOpen ? 'mr-3' : 'mx-auto'}`} />
          {isOpen && 'Settings'}
        </button>
      </div>
    </div>
  );
}