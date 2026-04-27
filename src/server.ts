import Fastify from "fastify";
import { mainRoutes } from "./routes.js";
import { initializeVectorStore } from "./utils/searchByVector.js";
import { warmup } from "./warmup/warmup.js";

const app = Fastify({
  logger: true,
});

const start = async () => {
  try {
    app.register(mainRoutes);
    initializeVectorStore();
    warmup();
    await app.listen({ host: "0.0.0.0", port: 3000 });
    console.log(`API listening on ${3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
