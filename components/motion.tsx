'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from 'framer-motion'

/* ── Shared variants — slow, subtle, heritage feel ── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

/* ── Global provider: respects prefers-reduced-motion for every child ── */

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

/* ── Scroll reveal wrapper (usable from server components) ── */

export function Reveal({
  children, delay = 0, y = 24, style, className,
}: {
  children: React.ReactNode; delay?: number; y?: number
  style?: React.CSSProperties; className?: string
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function FadeDown({
  children, delay = 0, style, className,
}: {
  children: React.ReactNode; delay?: number
  style?: React.CSSProperties; className?: string
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Photo zoom on hover ── */

export function HoverZoom({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div style={{ overflow: 'hidden', ...style }} whileHover="zoom">
      <motion.div
        variants={{ zoom: { scale: 1.06 } }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Count-up number (spring-driven, reduced-motion aware) ── */

export function CountUp({
  value, duration = 1.2, suffix = '', style, className,
}: {
  value: number; duration?: number; suffix?: string
  style?: React.CSSProperties; className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const reduced = useReducedMotion()
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    mv.set(value)
    const unsub = spring.on('change', v => setDisplay(Math.round(v)))
    return unsub
  }, [inView, value, reduced, mv, spring])

  const shown = reduced ? value : display
  return <span ref={ref} className={className} style={style}>{shown}{suffix}</span>
}

/* ── Animated voice player: pulsing wave bars while audio plays ── */

export function VoicePlayer({ src, accent = '#c9a84c' }: { src: string; accent?: string }) {
  const [playing, setPlaying] = useState(false)
  const reduced = useReducedMotion()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <audio
        controls src={src} preload="none"
        style={{ width: '100%', flex: 1, minWidth: 0, borderRadius: '8px', accentColor: accent }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '26px', flexShrink: 0, width: '34px', justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <motion.span
            key={i}
            style={{ width: '3px', borderRadius: '2px', background: accent, height: '6px' }}
            animate={playing && !reduced
              ? { height: ['6px', `${16 + (i % 3) * 6}px`, '6px'] }
              : { height: playing ? '14px' : '6px', opacity: playing ? 1 : 0.45 }}
            transition={playing && !reduced
              ? { duration: 0.8 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}
