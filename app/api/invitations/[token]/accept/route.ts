import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// POST /api/invitations/[token]/accept - Accept invitation
export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = params;

        // Find invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                organization: true,
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Check if invitation is for current user
        if (invitation.email !== session.user.email) {
            return NextResponse.json(
                { error: "This invitation is not for you" },
                { status: 403 }
            );
        }

        // Check if expired
        if (invitation.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invitation has expired" },
                { status: 400 }
            );
        }

        // Check if already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: invitation.organizationId,
            },
        });

        if (existingMember) {
            // Delete invitation and return success
            await prisma.invitation.delete({
                where: { id: invitation.id },
            });

            return NextResponse.json({
                message: "You are already a member of this organization",
                organizationId: invitation.organizationId,
            });
        }

        // Add user as member
        await prisma.organizationMember.create({
            data: {
                userId: session.user.id,
                organizationId: invitation.organizationId,
                role: invitation.role,
            },
        });

        // Delete invitation
        await prisma.invitation.delete({
            where: { id: invitation.id },
        });

        return NextResponse.json({
            message: "Invitation accepted successfully",
            organization: invitation.organization,
        });
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
