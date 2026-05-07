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

export const KNN = 5;
export const minimalScore = 0.6;

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

      const fraud_score = fraudCount / KNN;

      reply.send({
        fraud_score,
        approved: fraud_score < minimalScore,
      });
    },
  );
};
