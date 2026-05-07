import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FraudDetectionPayload } from "./schema.js";
import { convertToVector } from "./utils/convertToVector.js";
import { searchItemsByVector } from "./utils/searchByVector.js";

const RESPONSES = [
  Buffer.from('{"approved":true,"fraud_score":0.0}'),
  Buffer.from('{"approved":true,"fraud_score":0.2}'),
  Buffer.from('{"approved":true,"fraud_score":0.4}'),
  Buffer.from('{"approved":false,"fraud_score":0.6}'),
  Buffer.from('{"approved":false,"fraud_score":0.8}'),
  Buffer.from('{"approved":false,"fraud_score":1}'),
];

export const mainRoutes = (app: FastifyInstance) => {
  app.get("/ready", async (_, reply: FastifyReply) => {
    return reply.code(200).send();
  });

  app.post("/fraud-score", async (req: FastifyRequest, reply: FastifyReply) => {
    const data = req.body as FraudDetectionPayload;

    const dataToVector = convertToVector(data);

    const fraudCount = searchItemsByVector(dataToVector);

    const res = reply.raw;
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": RESPONSES[fraudCount].length,
    });
    res.end(RESPONSES[fraudCount]);

    reply.hijack();
  });
};
