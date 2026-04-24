import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FraudDetectionPayload, fraudDetectionSchema } from "./schema.js";
import { convertToVector } from "./utils/convertToVector.js";
import { searchItemsByVector } from "./utils/searchByVector.js";

export const mainRoutes = (app: FastifyInstance) => {
  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.post("/fraud-score", async (req: FastifyRequest, reply: FastifyReply) => {
    const minimalToApprove = 0.6;

    const data = req.body as FraudDetectionPayload;

    const dataToVector = convertToVector(data);

    //buscar os 5 vizinhos mais proximos
    const score = searchItemsByVector(dataToVector);

    const isApproved = Boolean(score < minimalToApprove);

    return reply.send({
      approved: isApproved,
      fraud_score: score,
    });
  });
};
