import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFile, writeFile } from "fs/promises";

const maxElements = 100000;

const raw = await readFile("./src/files/references.json", "utf-8");
const data = JSON.parse(raw);

export const index = new HierarchicalNSW("l2", 14);
index.initIndex(maxElements);

export const labelsMap: Record<number, string> = {};

// 3. Inserção iterativa no índice C++
for (let i = 0; i < data.length; i++) {
  // O método addPoint recebe o vetor [0.5, 0.2...] e um ID de identificação (o próprio 'i')
  index.addPoint(data[i].vector, i);

  // O rótulo é guardado no mapa paralelo usando o mesmo ID
  labelsMap[i] = data[i].label;
}

// 4. Exportação dos artefatos finais para o disco
index.writeIndexSync("./src/files/hnsw_index.dat");
await writeFile("./src/files/labels.json", JSON.stringify(labelsMap));
