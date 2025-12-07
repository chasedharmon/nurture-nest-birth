'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Animated Counter Component
 *
 * Animates counting up to a target number with a "slot machine" rolling effect.
 * Triggers animation when the element comes into view.
 */

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}

export function AnimatedCounter({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const counterRef = useRef<HTMLSpanElement>(null)

  const animateCounter = useCallback(() => {
    const startTime = Date.now()

    const updateCounter = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentCount = Math.floor(easeOut * end)
      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(updateCounter)
  }, [duration, end])

  useEffect(() => {
    const element = counterRef.current
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateCounter()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [hasAnimated, animateCounter])

  const formattedCount = decimals > 0 ? count.toFixed(decimals) : count

  return (
    <span ref={counterRef} className={className}>
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  )
}
