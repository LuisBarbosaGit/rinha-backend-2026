import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FraudDetectionPayload } from "./schema.js";
import { convertToVector } from "./utils/convertToVector.js";
import { searchItemsByVector } from "./utils/searchByVector.js";

const responseSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        approved: { type: "boolean" },
        fraud_score: { type: "number" },
      },
    },
  },
};

const RESPONSES = [
  { approved: true, fraud_score: 0.0 },
  { approved: true, fraud_score: 0.2 },
  { approved: true, fraud_score: 0.4 },
  { approved: false, fraud_score: 0.6 },
  { approved: false, fraud_score: 0.8 },
  { approved: false, fraud_score: 1.0 },
] as const;

export const mainRoutes = (app: FastifyInstance) => {
  app.get("/ready", async (_, reply: FastifyReply) => {
    return reply.code(200).send();
  });

  app.post(
    "/fraud-score",
    { schema: responseSchema },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const data = req.body as FraudDetectionPayload;

      const dataToVector = convertToVector(data);

      //buscar os 5 vizinhos mais proximos
      const fraudCount = searchItemsByVector(dataToVector);

      return reply.send(RESPONSES[fraudCount]);
    },
  );
};
