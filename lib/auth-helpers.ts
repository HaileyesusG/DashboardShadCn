import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { auth } from "./auth";

export async function getUserSession() {
    try {
        // Get session using better-auth
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return null;
        }

        return {
            user: session.user,
            session: session.session,
        };
    } catch (error) {
        return null;
    }
}

export async function requireAuth() {
    const session = await getUserSession();

    if (!session) {
        redirect("/signin");
    }

    return session;
}

export async function checkOrgMembership(userId: string, orgId: string) {
    const membership = await prisma.organizationMember.findFirst({
        where: {
            userId,
            organizationId: orgId,
        },
    });

    return membership;
}

export async function checkOrgOwner(userId: string, orgId: string) {
    const membership = await checkOrgMembership(userId, orgId);

    return membership?.role === "owner";
}

export async function requireOrgMembership(userId: string, orgId: string) {
    const membership = await checkOrgMembership(userId, orgId);

    if (!membership) {
        redirect("/");
    }

    return membership;
}

export async function requireOrgOwner(userId: string, orgId: string) {
    const isOwner = await checkOrgOwner(userId, orgId);

    if (!isOwner) {
        throw new Error("Unauthorized: Owner access required");
    }

    return true;
}
