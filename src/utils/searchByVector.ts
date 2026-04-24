import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFileSync } from "fs";

const index = new HierarchicalNSW("l2", 14);
const maxNeighbors = 5;
let labelsBuffer: Uint8Array;

export const initializeVectorStore = () => {
  index.readIndexSync("./files/hnsw_index.dat");
  index.setEf(40);

  const rawLabels = readFileSync("./files/labels.json", "utf-8");

  const data = JSON.parse(rawLabels);

  //Encontra o tamanho maximo da fileira
  const ids = Object.keys(data).map(Number);
  const maxId = ids.reduce((max, atual) => Math.max(max, atual), 0);

  //Aqui eu reservo um espaço na memoria do tamanho exato da lista
  labelsBuffer = new Uint8Array(maxId + 1);

  //Percorro o array de rawLabels, trocando o fraud por 1 e o não fraud por 0
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
