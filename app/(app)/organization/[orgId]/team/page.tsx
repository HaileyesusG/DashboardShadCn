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

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const orgId = params.orgId as string;

    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");

    useEffect(() => {
        fetchMembers();
    }, [orgId]);

    const fetchMembers = async () => {
        try {
            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(`/api/organization/${orgId}/members`, {
                headers: {
                    "Authorization": `Bearer ${sessionToken}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch members");

            const data = await response.json();
            setMembers(data.members);

            // Determine current user role (simplified - in production, get from session)
            const ownerMember = data.members.find((m: Member) => m.role === "owner");
            if (ownerMember) {
                setCurrentUserRole("owner"); // Simplified for demo
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
            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(`/api/organization/${orgId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                },
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
            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(
                `/api/organization/${orgId}/members?memberId=${memberId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${sessionToken}`,
                    },
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

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
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
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading members...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
