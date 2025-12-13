import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/config/terms'

/**
 * Grace period configuration
 */
const GRACE_PERIOD_DAYS = 3

/**
 * Routes that should be accessible even when trial is fully expired
 * (billing page, logout, etc.)
 */
const TRIAL_EXEMPT_ROUTES = [
  '/admin/setup/billing',
  '/admin/logout',
  '/api/auth',
]

/**
 * HTTP methods that indicate a write operation
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect /admin routes
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check terms acceptance for authenticated users accessing /admin
  // Skip check for accept-terms page itself to avoid redirect loop
  if (user && pathname.startsWith('/admin') && pathname !== '/accept-terms') {
    // Query user's terms acceptance status
    const { data: userData } = await supabase
      .from('users')
      .select('terms_accepted_at, terms_version')
      .eq('id', user.id)
      .single()

    const needsTermsAcceptance =
      !userData?.terms_accepted_at ||
      userData.terms_version !== CURRENT_TERMS_VERSION

    if (needsTermsAcceptance) {
      const url = request.nextUrl.clone()
      url.pathname = '/accept-terms'
      // Preserve original destination for redirect after accepting
      url.searchParams.set('redirect', pathname)
      const redirectResponse = NextResponse.redirect(url)
      // Copy cookies to maintain session
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  }

  // Check trial expiration for authenticated users accessing /admin
  if (user && pathname.startsWith('/admin')) {
    // Skip trial check for exempt routes (billing page, etc.)
    const isExemptRoute = TRIAL_EXEMPT_ROUTES.some(route =>
      pathname.startsWith(route)
    )

    if (!isExemptRoute) {
      // Get user's organization membership to find their org
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (membership) {
        // Get organization trial status
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status, trial_ends_at')
          .eq('id', membership.organization_id)
          .single()

        if (org?.subscription_status === 'trialing' && org.trial_ends_at) {
          const now = new Date()
          const trialEndsAt = new Date(org.trial_ends_at)
          const gracePeriodEndsAt = new Date(trialEndsAt)
          gracePeriodEndsAt.setDate(
            gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS
          )

          const isTrialExpired = now > trialEndsAt
          const isGracePeriodExpired = now > gracePeriodEndsAt
          const isWriteOperation = WRITE_METHODS.includes(request.method)

          // Fully expired (past grace period) - redirect to billing
          if (isGracePeriodExpired) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/setup/billing'
            url.searchParams.set('expired', 'true')
            const redirectResponse = NextResponse.redirect(url)
            supabaseResponse.cookies.getAll().forEach(cookie => {
              redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
          }

          // In grace period - block write operations
          if (isTrialExpired && isWriteOperation) {
            // Return 403 for API routes, redirect for page routes
            if (
              pathname.startsWith('/api/') ||
              pathname.startsWith('/admin/api/')
            ) {
              return new NextResponse(
                JSON.stringify({
                  error: 'Trial expired',
                  message:
                    'Your trial has expired. Please upgrade to continue making changes.',
                }),
                {
                  status: 403,
                  headers: { 'Content-Type': 'application/json' },
                }
              )
            }
            // For non-API write attempts, redirect to billing
            const url = request.nextUrl.clone()
            url.pathname = '/admin/setup/billing'
            url.searchParams.set('grace', 'true')
            const redirectResponse = NextResponse.redirect(url)
            supabaseResponse.cookies.getAll().forEach(cookie => {
              redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
          }
        }

        // Check for suspended status
        if (org?.subscription_status === 'suspended') {
          const url = request.nextUrl.clone()
          url.pathname = '/admin/setup/billing'
          url.searchParams.set('suspended', 'true')
          const redirectResponse = NextResponse.redirect(url)
          supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
          })
          return redirectResponse
        }
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
