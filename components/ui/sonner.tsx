"use client"

import { ShoppingCartIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useApp } from "@/context/app-context"

const Toaster = ({ ...props }: ToasterProps) => {
  const { isDark } = useApp()

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      icons={{
        success: <ShoppingCartIcon className="size-4 text-orange-400" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:       "!rounded-2xl !shadow-xl !px-4 !py-3.5 !font-sans !gap-3 !min-w-[260px] !max-w-[340px] !border",
          title:       "!text-[13px] !font-semibold",
          description: "!text-[12px] !font-normal !mt-0.5 !opacity-70",
          icon:        "!w-5 !h-5 !shrink-0",
        },
      }}
      style={isDark ? {
        /* ── Тёмная тема ── */
        "--normal-bg":      "#18181b",          /* zinc-900 */
        "--normal-border":  "rgba(63,63,70,1)", /* zinc-700 */
        "--normal-text":    "#e4e4e7",          /* zinc-200 */
        "--success-bg":     "#1c1410",          /* тёмный янтарный фон */
        "--success-border": "rgba(251,146,60,0.35)",
        "--success-text":   "#fdba74",          /* orange-300 — читаемо на тёмном */
        "--error-bg":       "#1c1010",
        "--error-border":   "rgba(248,113,113,0.35)",
        "--error-text":     "#fca5a5",          /* red-300 */
        "--border-radius":  "1rem",
      } as React.CSSProperties : {
        /* ── Светлая тема ── */
        "--normal-bg":      "#ffffff",
        "--normal-border":  "rgba(228,228,231,1)", /* zinc-200 */
        "--normal-text":    "#3f3f46",             /* zinc-700 */
        "--success-bg":     "rgb(255 247 237)",    /* orange-50 */
        "--success-border": "rgba(251,146,60,0.5)",
        "--success-text":   "#92400e",             /* amber-800 */
        "--error-bg":       "#fff5f5",
        "--error-border":   "rgba(248,113,113,0.5)",
        "--error-text":     "#991b1b",             /* red-800 */
        "--border-radius":  "1rem",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
