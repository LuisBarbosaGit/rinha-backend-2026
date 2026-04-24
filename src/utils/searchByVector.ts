import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFileSync } from "fs";

const index = new HierarchicalNSW("l2", 14);
let labelsMap: Record<number, string> = {};

export const initializeVectorStore = () => {
  index.readIndexSync("./files/hnsw_index.dat");

  const rawLabels = readFileSync("./files/labels.json", "utf-8");
  labelsMap = JSON.parse(rawLabels);
};

export const searchItemsByVector = (normalizeVector: number[]): number => {
  const resultOfSearch = index.searchKnn(normalizeVector, 5);

  let cheatCount = 0;

  for (let i = 0; i < resultOfSearch.neighbors.length; i++) {
    if (labelsMap[resultOfSearch.neighbors[i]] === "fraud") {
      cheatCount++;
    }
  }

  return cheatCount;
};
