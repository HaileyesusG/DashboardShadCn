import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// GET /api/invitations - List pending invitations for current user
export async function GET(request: NextRequest) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all pending invitations for this user's email
        const invitations = await prisma.invitation.findMany({
            where: {
                email: session.user.email,
                expiresAt: {
                    gte: new Date(), // Not expired
                },
            },
            include: {
                organization: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ invitations });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
