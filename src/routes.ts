import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fraudDetectionSchema } from "./schema.js";
import { convertToVector } from "./utils/convertToVector.js";
import { searchItemsByVector } from "./utils/searchByVector.js";

export const mainRoutes = (app: FastifyInstance) => {
  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.post("/fraud-score", async (req: FastifyRequest, reply: FastifyReply) => {
    const minimalToApprove = 0.6;

    //receber requisição
    const checkedReq = fraudDetectionSchema.safeParse(req.body);

    if (!checkedReq.success) {
      throw new Error("Invalid data");
    }

    const data = checkedReq.data;

    const dataToVector = convertToVector(data);

    //buscar os 5 vizinhos mais proximos
    const numberOfCheat = searchItemsByVector(dataToVector);

    const score = numberOfCheat / 5;
    const isApproved = Boolean(score < minimalToApprove);

    return reply.send({
      approved: isApproved,
      fraud_score: score,
    });
  });
};
