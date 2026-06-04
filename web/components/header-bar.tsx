"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function HeaderBar() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
            <h1 className="text-base font-semibold">城轨制造中心 跨系统工序一致比对</h1>
            <span suppressHydrationWarning>
                {mounted ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="切换亮暗模式">
                        {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>
                ) : (
                    <div className="size-8" />
                )}
            </span>
        </header>
    )
}
