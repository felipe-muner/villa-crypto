import { router } from "../init";
import { villaRouter } from "./villa";
import { bookingRouter } from "./booking";
import { adminRouter } from "./admin";
import { hostRouter } from "./host";
import { pricesRouter } from "./prices";
import { invitationRouter } from "./invitation";

export const appRouter = router({
  villa: villaRouter,
  booking: bookingRouter,
  admin: adminRouter,
  host: hostRouter,
  prices: pricesRouter,
  invitation: invitationRouter,
});

export type AppRouter = typeof appRouter;
