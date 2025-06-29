'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, FileText, Settings, BarChart3 } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Intrlink
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 