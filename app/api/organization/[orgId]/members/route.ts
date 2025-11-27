import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// GET /api/organization/[orgId]/members - List organization members
export async function GET(
    request: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;

        // Check if user is a member of the organization
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: orgId,
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get all members
        const members = await prisma.organizationMember.findMany({
            where: {
                organizationId: orgId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/organization/[orgId]/members - Invite member (creates invitation)
export async function POST(
    request: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if current user is owner
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: orgId,
            },
        });

        if (!membership || membership.role !== "owner") {
            return NextResponse.json(
                { error: "Only owners can invite members" },
                { status: 403 }
            );
        }

        // Check if user exists
        const invitedUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!invitedUser) {
            return NextResponse.json(
                { error: "User with this email does not exist" },
                { status: 404 }
            );
        }

        // Check if already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                userId: invitedUser.id,
                organizationId: orgId,
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "User is already a member of this organization" },
                { status: 400 }
            );
        }

        // Check if invitation already exists
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                organizationId: orgId,
            },
        });

        if (existingInvitation) {
            return NextResponse.json(
                { error: "Invitation already sent to this user" },
                { status: 400 }
            );
        }

        // Create invitation
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const invitation = await prisma.invitation.create({
            data: {
                email,
                organizationId: orgId,
                role: "member",
                token,
                expiresAt,
            },
        });

        return NextResponse.json(
            {
                message: "Invitation sent successfully",
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error inviting member:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/organization/[orgId]/members - Remove member (owner only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;
        const { searchParams } = new URL(request.url);
        const memberIdToRemove = searchParams.get("memberId");

        if (!memberIdToRemove) {
            return NextResponse.json(
                { error: "Member ID is required" },
                { status: 400 }
            );
        }

        // Check if user is owner
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: orgId,
                role: "owner",
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Forbidden: Owner access required" },
                { status: 403 }
            );
        }

        // Don't allow removing the owner
        const memberToRemove = await prisma.organizationMember.findUnique({
            where: { id: memberIdToRemove },
        });

        if (memberToRemove?.role === "owner") {
            return NextResponse.json(
                { error: "Cannot remove organization owner" },
                { status: 400 }
            );
        }

        // Remove member
        await prisma.organizationMember.delete({
            where: { id: memberIdToRemove },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
