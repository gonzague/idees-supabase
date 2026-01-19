'use client'

import { useState, useTransition } from 'react'
import { User } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarUpload } from './avatar-upload'
import { updateUsername, updatePassword } from '@/lib/actions/profile'
import { t } from '@/lib/i18n'

interface AccountFormProps {
  user: User
}

export function AccountForm({ user }: AccountFormProps) {
  const tr = t()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [username, setUsername] = useState(user.username || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === user.username) return
    
    setMessage(null)
    startTransition(async () => {
      const result = await updateUsername(username || '')
      if (result.success) {
        setMessage({ type: 'success', text: tr.account.saved })
      } else {
        setMessage({ type: 'error', text: result.error || tr.account.errors.updateFailed })
      }
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) return
    
    setMessage(null)
    startTransition(async () => {
      const result = await updatePassword(currentPassword, newPassword, confirmPassword)
      if (result.success) {
        setMessage({ type: 'success', text: tr.account.saved })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: result.error || tr.account.errors.updateFailed })
      }
    })
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tr.account.profile}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload user={user} />
          
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tr.account.usernameLabel}
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={50}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tr.account.emailLabel}
              </label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="mt-1 text-xs text-gray-500">
                L'email ne peut pas être modifié pour le moment
              </p>
            </div>
            
            <Button type="submit" disabled={isPending || username === user.username}>
              {isPending ? tr.account.saving : tr.account.saveChanges}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tr.account.changePassword}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tr.account.currentPassword}
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tr.account.newPassword}
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tr.account.confirmNewPassword}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
            >
              {isPending ? tr.account.saving : tr.account.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
