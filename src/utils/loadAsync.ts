import { readFileSync } from "node:fs";
import { join } from "node:path";

const loadJson = (fileName: string) => {
  const path = join(process.cwd(), "files", fileName);//Mude para src/files para rodar local
  return Object.freeze(JSON.parse(readFileSync(path, "utf-8")));
};

export const CONSTANTS = loadJson("normalization.json");
export const MCC_RISK = loadJson("mcc_risk.json");
