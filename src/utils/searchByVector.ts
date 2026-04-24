import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFileSync } from "fs";

const index = new HierarchicalNSW("l2", 14);
const maxNeighbors = 5;
let labelsBuffer: Uint8Array;

export const initializeVectorStore = () => {
  index.readIndexSync("./files/hnsw_index.dat"); //Mude para ./src/files para local
  index.setEf(90);

  const rawLabels = readFileSync("./files/labels.json", "utf-8"); //Mude para ./src/files para local

  const data = JSON.parse(rawLabels);

  
  const ids = Object.keys(data).map(Number);
  const maxId = ids.reduce((max, atual) => Math.max(max, atual), 0);

  
  labelsBuffer = new Uint8Array(maxId + 1);

  
  for (const [indice, label] of Object.entries(data)) {
    labelsBuffer[Number(indice)] = label === "fraud" ? 1 : 0;
  }
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
