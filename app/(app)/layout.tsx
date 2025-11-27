"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Users, FileText, Mail } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const orgId = params?.orgId as string;
    const [invitationCount, setInvitationCount] = useState(0);

    // Only show navigation if we're in an organization context
    const showNav = orgId && pathname?.includes(`/organization/${orgId}`);

    // Check for pending invitations
    useEffect(() => {
        const checkInvitations = async () => {
            try {
                const sessionToken = localStorage.getItem("session_token");
                if (!sessionToken) return;

                const response = await fetch("/api/invitations", {
                    headers: {
                        "Authorization": `Bearer ${sessionToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setInvitationCount(data.invitations?.length || 0);
                }
            } catch (error) {
                console.error("Error checking invitations:", error);
            }
        };

        checkInvitations();

        // Check for new invitations every 30 seconds
        const interval = setInterval(checkInvitations, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {showNav && (
                <nav className="bg-white border-b">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-8">
                                <h1 className="text-xl font-bold">Workspace</h1>
                                <div className="flex space-x-4">
                                    <Link
                                        href={`/organization/${orgId}/outline`}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname?.includes("/outline")
                                                ? "bg-slate-100 text-slate-900"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Outline</span>
                                    </Link>
                                    <Link
                                        href={`/organization/${orgId}/team`}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname?.includes("/team")
                                                ? "bg-slate-100 text-slate-900"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>Team</span>
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <Link
                                    href="/invitations"
                                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors relative"
                                >
                                    <Mail className="h-4 w-4" />
                                    <span>Invitations</span>
                                    {invitationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {invitationCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>
            )}
            <main>{children}</main>
        </div>
    );
}
