import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, publicProcedure, hostProcedure, protectedProcedure } from "../init";
import { insertVillaSchema, updateVillaSchema } from "../schemas";
import { villas } from "@/lib/db/schema";

export const villaRouter = router({
  // List all villas (public)
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(villas).orderBy(desc(villas.createdAt));
  }),

  // Get villa by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [villa] = await ctx.db
        .select()
        .from(villas)
        .where(eq(villas.id, input.id))
        .limit(1);

      if (!villa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Villa not found",
        });
      }

      return villa;
    }),

  // Create villa (host or admin only)
  create: hostProcedure
    .input(insertVillaSchema)
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";
      const isHost = ctx.session.user.isHost;

      // Determine ownerEmail
      // - Hosts: always set to their email
      // - Admins: can optionally set ownerEmail or leave null for platform villas
      let ownerEmail: string | null = null;
      if (isHost && !isAdmin) {
        ownerEmail = ctx.session.user.email;
      } else if (isAdmin && input.ownerEmail) {
        ownerEmail = input.ownerEmail;
      }

      const [newVilla] = await ctx.db
        .insert(villas)
        .values({
          name: input.name,
          description: input.description || null,
          location: input.location || null,
          pricePerNight: input.pricePerNight,
          images: input.images || [],
          amenities: input.amenities || [],
          maxGuests: input.maxGuests || 1,
          bedrooms: input.bedrooms || 1,
          bathrooms: input.bathrooms || 1,
          isActive: input.isActive ?? true,
          ownerEmail,
        })
        .returning();

      return newVilla;
    }),

  // Update villa (owner or admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateVillaSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";

      // Check ownership for non-admins
      if (!isAdmin) {
        const [existingVilla] = await ctx.db
          .select()
          .from(villas)
          .where(
            and(
              eq(villas.id, input.id),
              eq(villas.ownerEmail, ctx.session.user.email)
            )
          )
          .limit(1);

        if (!existingVilla) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Villa not found or you don't have permission",
          });
        }
      }

      const [updatedVilla] = await ctx.db
        .update(villas)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(villas.id, input.id))
        .returning();

      if (!updatedVilla) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Villa not found",
        });
      }

      return updatedVilla;
    }),

  // Delete villa (owner or admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";

      // Check ownership for non-admins
      if (!isAdmin) {
        const [existingVilla] = await ctx.db
          .select()
          .from(villas)
          .where(
            and(
              eq(villas.id, input.id),
              eq(villas.ownerEmail, ctx.session.user.email)
            )
          )
          .limit(1);

        if (!existingVilla) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Villa not found or you don't have permission",
          });
        }
      }

      const [deleted] = await ctx.db
        .delete(villas)
        .where(eq(villas.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Villa not found",
        });
      }

      return { success: true };
    }),
});
