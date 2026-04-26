"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TrendingUp, Wallet, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/", label: "Dashboard" },
  { href: "/news", label: "News" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl w-full h-16 px-4 md:px-8 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span
            className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground"
            aria-hidden="true"
          >
            <TrendingUp className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-semibold tracking-tight text-[15px]">
            TAG
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8 text-sm"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {!mounted ? (
          <Button
            variant="outline"
            className="gap-2 border-primary/60 text-primary opacity-50 cursor-not-allowed"
          >
            <Wallet className="size-4" />
            Loading...
          </Button>
        ) : isConnected ? (
          <Button
            variant="outline"
            className="gap-2 border-primary/60 text-primary hover:bg-destructive hover:text-destructive hover:border-destructive"
            onClick={() => disconnect()}
            title="Disconnect Wallet"
          >
            <Wallet className="size-4" />
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="gap-2 border-primary/60 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              // Jika metaMask tidak terdeteksi, kita langsung fallback ke injected connector
              const connector =
                connectors.find((c) => c.id === "metaMask") ?? connectors[0];
              if (connector) {
                connect({ connector });
              } else {
                alert(
                  "Wallet tidak ditemukan. Konfigurasi plugin dompet Anda tidak terbaca di browser ini.",
                );
              }
            }}
          >
            <Wallet className="size-4" />
            Connect
          </Button>
        )}
      </div>

      <nav
        aria-label="Primary mobile"
        className="md:hidden flex items-center justify-center gap-6 h-10 border-t border-border/70 text-sm"
      >
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
