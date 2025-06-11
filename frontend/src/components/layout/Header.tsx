'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/lib/stores/user'
import { User } from 'lucide-react'

export function Header() {
  const { currentUser, fetchCurrentUser } = useUserStore()

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold google-font">勤怠管理システム</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">
                {currentUser?.name || 'ゲスト'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}