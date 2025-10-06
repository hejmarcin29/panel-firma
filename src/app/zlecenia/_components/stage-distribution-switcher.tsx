"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type DistributionGroupId = "orders" | "installations" | "deliveries"

export type StageDistributionGroup = {
  id: DistributionGroupId
  label: string
  description: string
  items: Array<{
    id: string
    label: string
    count: number
  }>
  total: number
  emptyMessage: string
}

export type StageDistributionSwitcherProps = {
  groups: StageDistributionGroup[]
}

const accentStyles: Record<DistributionGroupId, { indicator: string; highlight: string; badge: string }> = {
  orders: {
    indicator: "bg-primary text-primary-foreground shadow-primary/40",
    highlight: "border border-primary/40 bg-primary/10 text-primary",
    badge: "border border-primary/40 bg-primary/15 text-primary",
  },
  installations: {
    indicator: "bg-emerald-500 text-emerald-50 shadow-emerald-500/30",
    highlight: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    badge: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-600",
  },
  deliveries: {
    indicator: "bg-sky-500 text-sky-50 shadow-sky-500/30",
    highlight: "border border-sky-500/40 bg-sky-500/10 text-sky-600",
    badge: "border border-sky-500/30 bg-sky-500/15 text-sky-600",
  },
}

export function StageDistributionSwitcher({ groups }: StageDistributionSwitcherProps) {
  const [activeId, setActiveId] = useState<DistributionGroupId>(() => groups[0]?.id ?? "orders")

  useEffect(() => {
    if (!groups.length) {
      return
    }

    if (!groups.some((group) => group.id === activeId)) {
      setActiveId(groups[0]!.id)
    }
  }, [groups, activeId])

  const activeGroup = useMemo(() => {
    if (!groups.length) {
      return null
    }

    return groups.find((group) => group.id === activeId) ?? groups[0]!
  }, [activeId, groups])

  const total = activeGroup?.total ?? 0

  const distributionWithPercentages = useMemo(
    () =>
      (activeGroup?.items ?? []).map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      })),
    [activeGroup?.items, total]
  )

  const highlight = useMemo(() => {
    if (!distributionWithPercentages.length || total === 0) {
      return null
    }

    return distributionWithPercentages.reduce((prev, current) =>
      current.percentage > prev.percentage ? current : prev
    )
  }, [distributionWithPercentages, total])

  const indicatorWidth = groups.length ? 100 / groups.length : 100
  const activeIndex = groups.findIndex((group) => group.id === activeId)
  const accent = accentStyles[activeGroup?.id ?? "orders"]

  return (
    <Card className="rounded-3xl border border-border/60">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">Rozkład etapów</CardTitle>
            <CardDescription>{activeGroup?.description ?? "Brak danych do wyświetlenia."}</CardDescription>
          </div>
          {groups.length ? (
            <div className="w-full max-w-[360px]">
              <div className="relative inline-flex w-full items-center rounded-full bg-muted p-1 text-xs font-semibold text-muted-foreground shadow-inner transition-colors sm:text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1 rounded-full transition-transform duration-300 ease-out will-change-transform",
                    accent.indicator
                  )}
                  style={{
                    width: `${indicatorWidth}%`,
                    transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
                  }}
                />
                {groups.map((group) => {
                  const isActive = group.id === activeId
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveId(group.id)}
                      className={cn(
                        "relative z-10 flex-1 rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                      aria-pressed={isActive}
                    >
                      {group.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium", accent.badge)}>
            Łącznie: {total}
          </Badge>
          {highlight && total > 0 ? (
            <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium", accent.highlight)}>
              Największy udział:
              <span className="font-semibold">{highlight.label}</span>
              <span className="opacity-80">({highlight.percentage}%)</span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            {activeGroup?.emptyMessage ?? "Brak danych do wyświetlenia."}
          </p>
        ) : (
          <div
            key={activeGroup?.id}
            className="grid gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2"
          >
            {distributionWithPercentages.map((bucket) => (
              <div key={bucket.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{bucket.label}</span>
                  <span className="text-muted-foreground">
                    {bucket.count} / {bucket.percentage}%
                  </span>
                </div>
                <Progress value={bucket.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
