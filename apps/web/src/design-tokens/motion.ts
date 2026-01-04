/**
 * Motion design tokens
 * Durations, easing, spring presets for framer-motion
 */

export const motion = {
  duration: {
    fast: 0.15,
    base: 0.2,
    slow: 0.3,
  },
  easing: {
    inOut: [0.4, 0, 0.2, 1],
    out: [0, 0, 0.2, 1],
    in: [0.4, 0, 1, 1],
  },
  spring: {
    default: {
      stiffness: 300,
      damping: 30,
    },
    gentle: {
      stiffness: 200,
      damping: 25,
    },
    stiff: {
      stiffness: 400,
      damping: 35,
    },
  },
} as const

export const motionVars = {
  'motion-duration-fast': `${motion.duration.fast}s`,
  'motion-duration-base': `${motion.duration.base}s`,
  'motion-duration-slow': `${motion.duration.slow}s`,
} as const


