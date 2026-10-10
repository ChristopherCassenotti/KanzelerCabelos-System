import type {
  FastifyInstance,
} from "fastify";

import { AuthController } from "../controllers/auth.controller";

const authController =
  new AuthController();

export async function authRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/login",
    (request, reply) => {
      return authController.login(
        request,
        reply,
      );
    },
  );

  app.post(
    "/refresh",
    (request, reply) => {
      return authController.refresh(
        request,
        reply,
      );
    },
  );

  app.post(
    "/logout",
    (request, reply) => {
      return authController.logout(
        request,
        reply,
      );
    },
  );
}