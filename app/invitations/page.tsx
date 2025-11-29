"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface Invitation {
    id: string;
    email: string;
    token: string;
    organization: {
        id: string;
        name: string;
    };
    createdAt: string;
}

export default function InvitationsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { data: session, isPending } = useSession();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/signin");
            return;
        }

        if (session) {
            fetchInvitations();
        }
    }, [session, isPending, router]);

    const fetchInvitations = async () => {
        try {
            const response = await fetch("/api/invitations", {
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setInvitations(data.invitations);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load invitations",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (token: string) => {
        try {
            const response = await fetch(`/api/invitations/${token}/accept`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to accept invitation");
            }

            const data = await response.json();

            toast({
                title: "Invitation accepted",
                description: `You've joined ${data.organization.name}`,
            });

            // Redirect to the organization
            router.push(`/organization/${data.organization.id}/outline`);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleReject = async (token: string) => {
        try {
            const response = await fetch(`/api/invitations/${token}/reject`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to reject invitation");
            }

            toast({
                title: "Invitation rejected",
            });

            fetchInvitations();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    if (isPending || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="container mx-auto max-w-2xl">
                <div className="mb-6">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Pending Invitations</CardTitle>
                        <CardDescription>
                            Accept or reject invitations to join organizations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invitations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending invitations
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invitations.map((invitation) => (
                                    <div
                                        key={invitation.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div>
                                            <h3 className="font-medium">{invitation.organization.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Invited to join as a member
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAccept(invitation.token)}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReject(invitation.token)}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
