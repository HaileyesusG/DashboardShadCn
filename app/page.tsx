"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const sessionToken = localStorage.getItem("session_token");
        const user = localStorage.getItem("user");

        if (sessionToken && user) {
            // Check for existing organizations and invitations
            Promise.all([
                fetch("/api/organization", {
                    headers: {
                        "Authorization": `Bearer ${sessionToken}`,
                    },
                }),
                fetch("/api/invitations", {
                    headers: {
                        "Authorization": `Bearer ${sessionToken}`,
                    },
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
                .catch(() => {
                    // On error, redirect to create organization
                    router.push("/create-organization");
                });
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </main>
        );
    }

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
