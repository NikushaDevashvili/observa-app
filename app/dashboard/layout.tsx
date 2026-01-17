"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setSessionToken(token);

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("sessionToken");
          router.push("/auth/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("sessionToken");
        router.push("/auth/login");
      });
  }, [router]);

  if (!sessionToken || !user) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:flex w-64 border-r p-4">
          <div className="space-y-4 w-full">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-[160px] w-full" />
          <Skeleton className="h-[240px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <Navbar />
          <div className="p-4 min-w-0 max-w-full overflow-x-hidden">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
