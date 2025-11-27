import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/debug/session - Debug session info
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader) {
            return NextResponse.json({
                error: "No authorization header",
                headers: Object.fromEntries(request.headers.entries())
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session) {
            return NextResponse.json({
                error: "Session not found in database",
                token: token.substring(0, 10) + "..."
            });
        }

        if (session.expiresAt < new Date()) {
            return NextResponse.json({
                error: "Session expired",
                expiresAt: session.expiresAt,
                now: new Date()
            });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            },
            session: {
                expiresAt: session.expiresAt,
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: "Internal error",
            message: error.message
        });
    }
}
