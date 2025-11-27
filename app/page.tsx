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
            // Check for pending invitations first
            fetch("/api/invitations", {
                headers: {
                    "Authorization": `Bearer ${sessionToken}`,
                },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.invitations && data.invitations.length > 0) {
                        // User has pending invitations
                        router.push("/invitations");
                    } else {
                        // No invitations, go to create organization
                        router.push("/create-organization");
                    }
                })
                .catch(() => {
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
