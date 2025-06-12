'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutStore } from '@/lib/stores/layout'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Calendar, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: '勤怠一覧', href: '/attendance', icon: Calendar },
  { name: 'レポート', href: '/reports', icon: BarChart3 },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useLayoutStore()

  const handleLinkClick = () => {
    // モバイルでリンクをクリックしたらサイドバーを閉じる
    setSidebarOpen(false)
  }

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 pt-16",
        // デスクトップでは常に表示（md以上）
        "md:block",
        // モバイルでの表示制御
        sidebarOpen ? "block" : "hidden md:block",
        // トランジション効果（モバイルのみ）
        "transition-transform duration-200 ease-in-out md:transition-none",
        // モバイルでのスライドアニメーション
        "transform md:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <nav className="flex flex-col h-full">
          {/* モバイル用閉じるボタン */}
          <div className="flex justify-end p-4 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
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
    </>
  )
}