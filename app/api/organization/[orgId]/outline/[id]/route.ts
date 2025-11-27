import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// PATCH /api/organization/[orgId]/outline/[id] - Update outline
export async function PATCH(
    request: NextRequest,
    { params }: { params: { orgId: string; id: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId, id } = params;
        const body = await request.json();
        const { header, sectionType, status, target, limit, reviewer } = body;

        // Check if user is a member
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: orgId,
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify outline belongs to organization
        const existingOutline = await prisma.outline.findUnique({
            where: { id },
        });

        if (!existingOutline || existingOutline.organizationId !== orgId) {
            return NextResponse.json({ error: "Outline not found" }, { status: 404 });
        }

        // Update outline
        const outline = await prisma.outline.update({
            where: { id },
            data: {
                ...(header && { header }),
                ...(sectionType && { sectionType }),
                ...(status && { status }),
                ...(target !== undefined && { target: parseInt(target) }),
                ...(limit !== undefined && { limit: parseInt(limit) }),
                ...(reviewer && { reviewer }),
            },
        });

        return NextResponse.json({ outline });
    } catch (error) {
        console.error("Error updating outline:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/organization/[orgId]/outline/[id] - Delete outline
export async function DELETE(
    request: NextRequest,
    { params }: { params: { orgId: string; id: string } }
) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId, id } = params;

        // Check if user is a member
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                organizationId: orgId,
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify outline belongs to organization
        const existingOutline = await prisma.outline.findUnique({
            where: { id },
        });

        if (!existingOutline || existingOutline.organizationId !== orgId) {
            return NextResponse.json({ error: "Outline not found" }, { status: 404 });
        }

        // Delete outline
        await prisma.outline.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting outline:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
