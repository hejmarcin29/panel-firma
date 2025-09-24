import React from 'react'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-black/10 dark:bg-white/10 ${className ?? ''}`} />)
}

export default Skeleton
