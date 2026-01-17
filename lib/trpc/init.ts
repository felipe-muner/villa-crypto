import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import superjson from "superjson";
import type { UserRole } from "@/lib/types/database";

// Context type
export interface Context {
  db: typeof db;
  session: {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isHost: boolean;
    };
  } | null;
}

// Create context for each request
export const createContext = async (): Promise<Context> => {
  const session = await auth();

  return {
    db,
    session: session as Context["session"],
  };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Middleware to check if user is authenticated
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Middleware to check if user is admin
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  if (ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Middleware to check if user is host or admin
const isHostOrAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  if (ctx.session.user.role !== "admin" && !ctx.session.user.isHost) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a host or admin to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Protected procedures
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
export const hostProcedure = t.procedure.use(isHostOrAdmin);
