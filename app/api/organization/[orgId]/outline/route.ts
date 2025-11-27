import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// GET /api/organization/[orgId]/outline - List all outlines
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

        // Get all outlines for this organization
        const outlines = await prisma.outline.findMany({
            where: {
                organizationId: orgId,
            },
            orderBy: {
                order: "asc",
            },
        });

        return NextResponse.json({ outlines });
    } catch (error) {
        console.error("Error fetching outlines:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/organization/[orgId]/outline - Create new outline
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
        const { header, sectionType, status, target, limit, reviewer } = body;

        // Validate required fields
        if (!header || !sectionType || !status || target === undefined || limit === undefined || !reviewer) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

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

        // Create outline
        // Get max order
        const lastItem = await prisma.outline.findFirst({
            where: { organizationId: orgId },
            orderBy: { order: 'desc' },
        });
        const newOrder = (lastItem?.order ?? -1) + 1;

        // Create outline
        const outline = await prisma.outline.create({
            data: {
                header,
                sectionType,
                status,
                target: parseInt(target),
                limit: parseInt(limit),
                reviewer,
                order: newOrder,
                organizationId: orgId,
            },
        });

        return NextResponse.json({ outline }, { status: 201 });
    } catch (error) {
        console.error("Error creating outline:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
