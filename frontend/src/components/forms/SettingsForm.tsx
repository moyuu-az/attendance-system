"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useUserStore } from '@/lib/stores/user'
import { useToast } from '@/components/ui/use-toast'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const userSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
})

const hourlyRateSchema = z.object({
  hourly_rate: z.string()
    .min(1, '時給を入力してください')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: '有効な金額を入力してください',
    }),
})

type UserFormValues = z.infer<typeof userSchema>
type HourlyRateFormValues = z.infer<typeof hourlyRateSchema>

export function SettingsForm() {
  const { toast } = useToast()
  const { currentUser: user, isLoading, error, fetchCurrentUser, updateUser, updateHourlyRate } = useUserStore()
  // 更新中の状態を管理するためのstateは不要（ストアのisLoadingを使用）

  // ユーザー情報取得
  useEffect(() => {
    console.log('SettingsForm - fetching user data...')
    fetchCurrentUser()
  }, [fetchCurrentUser])

  console.log('SettingsForm - isLoading:', isLoading, 'user:', user, 'error:', error)

  // ユーザー情報フォーム
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  // 時給フォーム
  const hourlyRateForm = useForm<HourlyRateFormValues>({
    resolver: zodResolver(hourlyRateSchema),
    values: {
      hourly_rate: user?.hourly_rate?.toString() || '1000',
    },
  })

  const onSubmitUser = async (data: UserFormValues) => {
    try {
      await updateUser(data)
      toast({
        title: "更新完了",
        description: "ユーザー情報を更新しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  const onSubmitHourlyRate = async (data: HourlyRateFormValues) => {
    try {
      await updateHourlyRate(Number(data.hourly_rate))
      toast({
        title: "更新完了",
        description: "時給を更新しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">データの読み込みに失敗しました</p>
        <p className="text-sm text-gray-500">{error?.message || 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ユーザー情報設定 */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー情報</CardTitle>
          <CardDescription>
            プロフィール情報を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名前</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="山田 太郎" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="taro@example.com" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? '更新中...' : '保存'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 時給設定 */}
      <Card>
        <CardHeader>
          <CardTitle>時給設定</CardTitle>
          <CardDescription>
            時給単価を設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...hourlyRateForm}>
            <form onSubmit={hourlyRateForm.handleSubmit(onSubmitHourlyRate)} className="space-y-4">
              <FormField
                control={hourlyRateForm.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>時給（円）</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      1時間あたりの金額を入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? '更新中...' : '保存'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}