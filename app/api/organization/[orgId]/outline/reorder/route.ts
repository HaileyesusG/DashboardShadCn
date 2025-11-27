import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

export async function PUT(
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
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
        }

        // Check membership
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: session.user.id, organizationId: orgId },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Transaction update
        await prisma.$transaction(
            ids.map((id: string, index: number) =>
                prisma.outline.update({
                    where: { id, organizationId: orgId },
                    data: { order: index },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering outlines:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
