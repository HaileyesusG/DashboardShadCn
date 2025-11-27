import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// POST /api/invitations/[token]/reject - Reject invitation
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

        // Delete invitation
        await prisma.invitation.delete({
            where: { id: invitation.id },
        });

        return NextResponse.json({
            message: "Invitation rejected successfully",
        });
    } catch (error) {
        console.error("Error rejecting invitation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
