'use client'

import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { SettingsForm } from '@/components/forms/SettingsForm'

export default function SettingsPage() {
  useEffect(() => {
    console.log('SettingsPage mounted')
  }, [])

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground mt-2">
            アカウント情報や時給単価の設定を管理します
          </p>
        </div>
        <SettingsForm />
      </div>
    </Layout>
  )
}