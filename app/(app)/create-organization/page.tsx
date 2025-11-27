"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreateOrganizationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingOrgs, setIsCheckingOrgs] = useState(true);
    const [orgName, setOrgName] = useState("");

    useEffect(() => {
        // Check if user already has organizations
        const checkExistingOrganizations = async () => {
            try {
                const sessionToken = localStorage.getItem("session_token");
                if (!sessionToken) {
                    router.push("/signin");
                    return;
                }

                const response = await fetch("/api/organization", {
                    headers: {
                        "Authorization": `Bearer ${sessionToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.organizations && data.organizations.length > 0) {
                        // User has organizations, redirect to the first one
                        const firstOrg = data.organizations[0];
                        router.push(`/organization/${firstOrg.id}/outline`);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error checking organizations:", error);
            } finally {
                setIsCheckingOrgs(false);
            }
        };

        checkExistingOrganizations();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const sessionToken = localStorage.getItem("session_token");

            if (!sessionToken) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/organization", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    name: orgName,
                    slug: orgName.toLowerCase().replace(/\s+/g, "-"),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create organization");
            }

            const data = await response.json();

            toast({
                title: "Organization created",
                description: `${orgName} has been created successfully.`,
            });

            router.push(`/organization/${data.organization.id}/outline`);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create organization",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingOrgs) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
                    <CardDescription>
                        Create a new organization to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Acme Inc."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Organization"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
