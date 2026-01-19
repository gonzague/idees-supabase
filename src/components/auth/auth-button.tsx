import { getProfile } from '@/lib/actions/auth'
import { SignInButton } from './sign-in-button'
import { UserMenu } from './user-menu'

export async function AuthButton() {
  const profile = await getProfile()

  if (!profile) {
    return <SignInButton />
  }

  return <UserMenu profile={profile} />
}
