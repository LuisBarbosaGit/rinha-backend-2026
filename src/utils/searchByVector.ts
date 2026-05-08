import { readFileSync } from "node:fs";

const CENTROIDS_COUNT = 1000;
const DIMS = 14;
const TOTAL = 3000000;


const rawBuffer = readFileSync("./database.bin");

let offset = 0;

// Mapeia o buffer contíguo sem duplicar a memória (Zero-Copy)
const centroidsLength = CENTROIDS_COUNT * DIMS;
const centroids = new Int8Array(
  rawBuffer.buffer,
  rawBuffer.byteOffset + offset,
  centroidsLength,
);
offset += centroidsLength;

const clusterOffsets = new Int32Array(
  rawBuffer.buffer,
  rawBuffer.byteOffset + offset,
  CENTROIDS_COUNT,
);
offset += CENTROIDS_COUNT * 4; // Int32 ocupa 4 bytes

const clusterSizes = new Int32Array(
  rawBuffer.buffer,
  rawBuffer.byteOffset + offset,
  CENTROIDS_COUNT,
);
offset += CENTROIDS_COUNT * 4;

const vectorsLength = TOTAL * DIMS;
const vectors = new Int8Array(
  rawBuffer.buffer,
  rawBuffer.byteOffset + offset,
  vectorsLength,
);
offset += vectorsLength;

const labels = new Uint8Array(
  rawBuffer.buffer,
  rawBuffer.byteOffset + offset,
  TOTAL,
);

/**
 * Busca os vizinhos usando a estratégia de IVF (Inverted File Index)
 * @param queryFloatArray O vetor original que chegou no body da requisição
 * @param k Número de vizinhos
 */
export function searchItemsByVector(
  queryFloatArray: Float32Array,
  k: number = 5,
): number {
  // 1. Transforma a query Float em Int8 (O mesmo cálculo feito no build)
  const query = new Int8Array(DIMS);
  for (let i = 0; i < DIMS; i++) {
    let val = Math.round(queryFloatArray[i] * 127);
    query[i] = Math.max(-128, Math.min(127, val));
  }

  // 2. Acha a "Caixa" mais parecida comparando apenas com os 1000 centróides
  let bestCluster = 0;
  let minCentroidDist = Infinity;
  for (let c = 0; c < CENTROIDS_COUNT; c++) {
    let dist = 0;
    const cOffset = c * DIMS;
    for (let j = 0; j < DIMS; j++) {
      const diff = query[j] - centroids[cOffset + j];
      dist += diff * diff;
    }
    if (dist < minCentroidDist) {
      minCentroidDist = dist;
      bestCluster = c;
    }
  }

  // 3. Limita a Força Bruta apenas aos dados dentro dessa caixa vencedora!
  const startIdx = clusterOffsets[bestCluster];
  const size = clusterSizes[bestCluster];

  const topDistances = [Infinity, Infinity, Infinity, Infinity, Infinity];
  const topIndices = [-1, -1, -1, -1, -1];

  for (let i = 0; i < size; i++) {
    const globalIdx = startIdx + i;
    const vOffset = globalIdx * DIMS;
    let dist = 0;

    for (let j = 0; j < DIMS; j++) {
      const diff = query[j] - vectors[vOffset + j];
      dist += diff * diff;
    }

    // Se achou um vetor mais próximo que o pior do nosso Top 5
    if (dist < topDistances[4]) {
      topDistances[4] = dist;
      topIndices[4] = globalIdx;

      // Insertion sort minúsculo para manter os 5 melhores ordenados
      for (let n = 3; n >= 0; n--) {
        if (topDistances[n] > topDistances[n + 1]) {
          const tempD = topDistances[n];
          topDistances[n] = topDistances[n + 1];
          topDistances[n + 1] = tempD;

          const tempI = topIndices[n];
          topIndices[n] = topIndices[n + 1];
          topIndices[n + 1] = tempI;
        } else {
          break;
        }
      }
    }
  }

  // 4. Checa as labels de fraude dos 5 eleitos
  let fraudCount = 0;
  for (let i = 0; i < k; i++) {
    const idx = topIndices[i];
    if (idx !== -1 && labels[idx] === 1) {
      fraudCount++;
    }
  }

  return fraudCount;
}
