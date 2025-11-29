"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        ownedOrganizations?: Array<{
            id: string;
            name: string;
        }>;
    };
}

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { data: session, isPending } = useSession();
    const orgId = params.orgId as string;

    const [members, setMembers] = useState<Member[]>([]);
    const [organizationName, setOrganizationName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/signin");
            return;
        }

        if (session) {
            fetchMembers();
            fetchOrganization();
        }
    }, [orgId, session, isPending, router]);

    const fetchOrganization = async () => {
        try {
            const response = await fetch("/api/organization", {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                const currentOrg = data.organizations?.find((org: any) => org.id === orgId);
                if (currentOrg) {
                    setOrganizationName(currentOrg.name);
                }
            }
        } catch (error) {
            console.error("Error fetching organization:", error);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await fetch(`/api/organization/${orgId}/members`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch members");

            const data = await response.json();
            setMembers(data.members);

            // Determine current user role
            const ownerMember = data.members.find((m: Member) => m.user.id === session?.user.id);
            if (ownerMember) {
                setCurrentUserRole(ownerMember.role);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load team members",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);

        try {
            const response = await fetch(`/api/organization/${orgId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email: inviteEmail }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to invite member");
            }

            toast({
                title: "Invitation sent",
                description: `An invitation has been sent to ${inviteEmail}`,
            });

            setInviteEmail("");
            setDialogOpen(false);
            fetchMembers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            const response = await fetch(
                `/api/organization/${orgId}/members?memberId=${memberId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to remove member");
            }

            toast({
                title: "Member removed",
                description: "The member has been removed from the organization",
            });

            fetchMembers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const isOwner = currentUserRole === "owner";

    if (isPending || isLoading) {
        return (
            <div className="container mx-auto py-10 text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            {organizationName && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    Organization: <span className="font-medium text-foreground">{organizationName}</span>
                                </p>
                            )}
                            <CardTitle className="text-2xl">Team Members</CardTitle>
                            <CardDescription>
                                Manage your organization members and their roles
                            </CardDescription>
                        </div>
                        {isOwner && (
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Invite Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                        <DialogDescription>
                                            Enter the email address of the user you want to invite
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleInvite}>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="colleague@example.com"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isInviting}>
                                                {isInviting ? "Inviting..." : "Send Invite"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Organizations</TableHead>
                                {isOwner && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        {member.user.name || "N/A"}
                                    </TableCell>
                                    <TableCell>{member.user.email}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.role === "owner"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {member.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {member.user.ownedOrganizations && member.user.ownedOrganizations.length > 0 ? (
                                            <span className="text-sm">
                                                {member.user.ownedOrganizations.map(org => org.name).join(", ")}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    {isOwner && (
                                        <TableCell className="text-right">
                                            {member.role !== "owner" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemove(member.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    );
}
