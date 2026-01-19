import Link from 'next/link'
import { getSocialLinks, SITE_URL, SITE_NAME, GITHUB_REPO_URL } from '@/lib/config'

export function Footer() {
  const socialLinks = getSocialLinks()
  const displayUrl = SITE_URL.replace(/^https?:\/\//, '')

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          {socialLinks.length > 0 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Retrouvez-moi sur :
              </p>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                {socialLinks.map((link, index) => (
                  <div key={link.href} className="flex items-center gap-2 sm:gap-4">
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      {link.icon} {link.label}
                    </Link>
                    {index < socialLinks.length - 1 && (
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            © {new Date().getFullYear()}{' '}
            <Link 
              href={SITE_URL} 
              className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {displayUrl}
            </Link>
            {' '}&middot;{' '}
            <span className="text-slate-400 dark:text-slate-500">
              Propulsé par{' '}
              <Link
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {SITE_NAME}
              </Link>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
