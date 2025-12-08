'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type {
  VisitorProfile,
  PersonalizedContent,
} from '@/lib/personalization/types'
import {
  generatePersonalizedContent,
  createAnonymousProfile,
} from '@/lib/personalization/engine'
import {
  getVisitorProfile,
  trackPageView,
  identifyVisitor,
} from '@/app/actions/personalization'

interface PersonalizationContextValue {
  profile: VisitorProfile | null
  content: PersonalizedContent | null
  isLoading: boolean
  identify: (
    email: string,
    name?: string,
    additionalData?: { dueDate?: string; serviceInterest?: string }
  ) => Promise<void>
  refresh: () => Promise<void>
}

const PersonalizationContext =
  createContext<PersonalizationContextValue | null>(null)

interface PersonalizationProviderProps {
  children: ReactNode
}

export function PersonalizationProvider({
  children,
}: PersonalizationProviderProps) {
  const [profile, setProfile] = useState<VisitorProfile | null>(null)
  const [content, setContent] = useState<PersonalizedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const visitorProfile = await getVisitorProfile()
        if (visitorProfile) {
          setProfile(visitorProfile)
          setContent(generatePersonalizedContent(visitorProfile))
        } else {
          // Create anonymous profile for first-time visitors
          const anonymousProfile = createAnonymousProfile()
          setProfile(anonymousProfile)
          setContent(generatePersonalizedContent(anonymousProfile))
        }
      } catch (error) {
        console.error('Failed to load visitor profile:', error)
        // Fallback to anonymous profile on error
        const anonymousProfile = createAnonymousProfile()
        setProfile(anonymousProfile)
        setContent(generatePersonalizedContent(anonymousProfile))
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname).catch(error => {
        console.error('Failed to track page view:', error)
      })
    }
  }, [pathname])

  // Identify visitor (e.g., after newsletter signup or contact form)
  const identify = useCallback(
    async (
      email: string,
      name?: string,
      additionalData?: { dueDate?: string; serviceInterest?: string }
    ) => {
      try {
        setIsLoading(true)
        const result = await identifyVisitor(email, name, additionalData)
        if (result.success && result.profile) {
          setProfile(result.profile)
          setContent(generatePersonalizedContent(result.profile))
        }
      } catch (error) {
        console.error('Failed to identify visitor:', error)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Refresh profile
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      const visitorProfile = await getVisitorProfile()
      if (visitorProfile) {
        setProfile(visitorProfile)
        setContent(generatePersonalizedContent(visitorProfile))
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <PersonalizationContext.Provider
      value={{ profile, content, isLoading, identify, refresh }}
    >
      {children}
    </PersonalizationContext.Provider>
  )
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext)
  if (!context) {
    throw new Error(
      'usePersonalization must be used within a PersonalizationProvider'
    )
  }
  return context
}

// Optional hook for components that might be outside the provider
export function useOptionalPersonalization() {
  return useContext(PersonalizationContext)
}
