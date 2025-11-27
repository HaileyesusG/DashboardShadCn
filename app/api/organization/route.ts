import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth-helpers";

// POST /api/organization - Create organization
export async function POST(request: NextRequest) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
                { status: 400 }
            );
        }

        // Create organization
        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
            },
        });

        // Add creator as owner
        await prisma.organizationMember.create({
            data: {
                userId: session.user.id,
                organizationId: organization.id,
                role: "owner",
            },
        });

        return NextResponse.json({ organization }, { status: 201 });
    } catch (error) {
        console.error("Error creating organization:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/organization - List user's organizations
export async function GET(request: NextRequest) {
    try {
        const session = await getUserSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const memberships = await prisma.organizationMember.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                organization: true,
            },
        });

        const organizations = memberships.map((m) => ({
            ...m.organization,
            role: m.role,
        }));

        return NextResponse.json({ organizations });
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
