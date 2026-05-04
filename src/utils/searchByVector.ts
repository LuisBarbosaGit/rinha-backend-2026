import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFileSync } from "fs";

const index = new HierarchicalNSW("l2", 14);
const maxNeighbors = 5;
let labelsBuffer: Uint8Array;

export const initializeVectorStore = () => {
  index.readIndexSync("./files/hnsw_index.dat"); //Mude para ./src/files para local
  index.setEf(120);

  const buffer = readFileSync("./files/labels.bin");
  labelsBuffer = new Uint8Array(buffer);
};

export const searchItemsByVector = (normalizeVector: number[]): number => {
  const resultOfSearch = index.searchKnn(normalizeVector, maxNeighbors);

  let cheatCount = 0;

  for (let i = 0; i < resultOfSearch.neighbors.length; i++) {
    // Acesso direto ao buffer por índice numérico
    cheatCount += labelsBuffer[resultOfSearch.neighbors[i]];
  }

  return cheatCount / maxNeighbors;
};
