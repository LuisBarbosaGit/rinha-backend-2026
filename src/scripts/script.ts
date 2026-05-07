import { readFileSync, writeFileSync } from "node:fs";

const rawData = JSON.parse(readFileSync("./src/files/references.json", "utf-8"));
const TOTAL = rawData.length; // Esperado: 3.000.000
const DIMS = 14;
const CENTROIDS_COUNT = 1000;

// 1. Converte e quantiza todos os dados originais para a memória temporária
const rawVectors = new Int8Array(TOTAL * DIMS);
const labels = new Uint8Array(TOTAL);

for (let i = 0; i < TOTAL; i++) {
  labels[i] = rawData[i].label === "fraud" ? 1 : 0;
  for (let j = 0; j < DIMS; j++) {
    // Escala seu float para um Int8.
    // Nota: Assumindo que seus floats originais vão de -1.0 a 1.0.
    // Se forem diferentes, ajuste a matemática aqui!
    let val = Math.round(rawData[i].vector[j] * 127);
    rawVectors[i * DIMS + j] = Math.max(-128, Math.min(127, val));
  }
}

// 2. Inicializa os 1000 Centróides (Caixas) pegando itens aleatórios
const centroids = new Int8Array(CENTROIDS_COUNT * DIMS);
for (let c = 0; c < CENTROIDS_COUNT; c++) {
  const randomIdx = Math.floor(Math.random() * TOTAL);
  centroids.set(
    rawVectors.subarray(randomIdx * DIMS, randomIdx * DIMS + DIMS),
    c * DIMS,
  );
}

// 3. Agrupamento (Descobre em qual caixa cada um dos 3M de vetores pertence)
const clusterAssignments = new Int32Array(TOTAL);
const clusterSizes = new Int32Array(CENTROIDS_COUNT);

for (let i = 0; i < TOTAL; i++) {
  let minDist = Infinity;
  let bestCluster = 0;

  for (let c = 0; c < CENTROIDS_COUNT; c++) {
    let dist = 0;
    for (let j = 0; j < DIMS; j++) {
      const diff = rawVectors[i * DIMS + j] - centroids[c * DIMS + j];
      dist += diff * diff;
    }
    if (dist < minDist) {
      minDist = dist;
      bestCluster = c;
    }
  }

  clusterAssignments[i] = bestCluster;
  clusterSizes[bestCluster]++;
}

// 4. Reorganiza os dados no Buffer Final de forma contígua
const finalVectors = new Int8Array(TOTAL * DIMS);
const finalLabels = new Uint8Array(TOTAL);
const clusterOffsets = new Int32Array(CENTROIDS_COUNT);

let currentOffset = 0;
for (let c = 0; c < CENTROIDS_COUNT; c++) {
  clusterOffsets[c] = currentOffset;
  currentOffset += clusterSizes[c];
}

const currentPositions = new Int32Array(clusterOffsets);
for (let i = 0; i < TOTAL; i++) {
  const c = clusterAssignments[i];
  const pos = currentPositions[c]++;

  finalLabels[pos] = labels[i];
  finalVectors.set(rawVectors.subarray(i * DIMS, i * DIMS + DIMS), pos * DIMS);
}

// 5. Concatena todos os bytes e salva no disco!
const finalBuffer = Buffer.concat([
  Buffer.from(centroids.buffer), // 14.000 bytes
  Buffer.from(clusterOffsets.buffer), // 4.000 bytes
  Buffer.from(clusterSizes.buffer), // 4.000 bytes
  Buffer.from(finalVectors.buffer), // 42.000.000 bytes
  Buffer.from(finalLabels.buffer), // 3.000.000 bytes
]);

writeFileSync("./database.bin", finalBuffer);
