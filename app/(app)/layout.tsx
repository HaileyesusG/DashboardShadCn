"use client";

import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const orgId = params?.orgId as string;

    // Only show sidebar if we're in an organization context
    const showSidebar = orgId;

    if (!showSidebar) {
        return <div className="min-h-screen bg-slate-50">{children}</div>;
    }

    return (
        <SidebarProvider>
            <AppSidebar orgId={orgId} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                </header>
                <main className="flex-1">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
