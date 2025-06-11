'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Calendar, 
  FileText, 
  Settings 
} from 'lucide-react'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: '勤怠一覧', href: '/attendance', icon: Calendar },
  { name: 'レポート', href: '/reports', icon: FileText },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 pt-16">
      <nav className="flex flex-col h-full">
        <div className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon 
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  )} 
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}