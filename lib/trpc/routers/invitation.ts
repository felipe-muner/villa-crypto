import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { hostInvitations, users } from "@/lib/db/schema";

export const invitationRouter = router({
  // Get invitation by token (public - for invite page)
  getByToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select()
        .from(hostInvitations)
        .where(eq(hostInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if expired
      if (invitation.status === "pending" && new Date() > invitation.expiresAt) {
        await ctx.db
          .update(hostInvitations)
          .set({ status: "expired" })
          .where(eq(hostInvitations.id, invitation.id));

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This invitation has expired",
        });
      }

      return {
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      };
    }),

  // Accept invitation (protected - user must be logged in)
  accept: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Get invitation
      const [invitation] = await ctx.db
        .select()
        .from(hostInvitations)
        .where(eq(hostInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if already accepted
      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });
      }

      // Check if expired
      if (new Date() > invitation.expiresAt) {
        await ctx.db
          .update(hostInvitations)
          .set({ status: "expired" })
          .where(eq(hostInvitations.id, invitation.id));

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This invitation has expired",
        });
      }

      // Check email matches
      if (ctx.session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is for a different email address",
        });
      }

      // Update invitation status
      await ctx.db
        .update(hostInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(hostInvitations.id, invitation.id));

      // Update user to be a host
      await ctx.db
        .update(users)
        .set({
          isHost: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, ctx.session.user.email));

      return { success: true };
    }),
});
