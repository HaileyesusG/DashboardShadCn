"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function Home() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (isPending) return; // Wait for session to load

        if (session?.user) {
            // User is authenticated, check for organizations and invitations
            setIsChecking(true);

            Promise.all([
                fetch("/api/organization", {
                    credentials: 'include',
                }),
                fetch("/api/invitations", {
                    credentials: 'include',
                })
            ])
                .then(([orgRes, invRes]) => Promise.all([orgRes.json(), invRes.json()]))
                .then(([orgData, invData]) => {
                    // Priority 1: Check for pending invitations
                    if (invData.invitations && invData.invitations.length > 0) {
                        router.push("/invitations");
                        return;
                    }

                    // Priority 2: Check for existing organizations
                    if (orgData.organizations && orgData.organizations.length > 0) {
                        // User has organizations, redirect to the first one
                        const firstOrg = orgData.organizations[0];
                        router.push(`/organization/${firstOrg.id}/outline`);
                        return;
                    }

                    // Priority 3: No organizations or invitations, create one
                    router.push("/create-organization");
                })
                .catch((error) => {
                    console.error("Error checking organizations:", error);
                    // On error, redirect to create organization
                    router.push("/create-organization");
                })
                .finally(() => {
                    setIsChecking(false);
                });
        }
    }, [session, isPending, router]);

    if (isPending || isChecking) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </main>
        );
    }

    // Show landing page only for unauthenticated users
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold tracking-tight">Multi-Tenant Workspace</h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                    Collaborate with your team, manage organizations, and track your outlines
                </p>
                <div className="flex gap-4 justify-center pt-6">
                    <Link href="/signup">
                        <Button size="lg">Get Started</Button>
                    </Link>
                    <Link href="/signin">
                        <Button size="lg" variant="outline">Sign In</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
