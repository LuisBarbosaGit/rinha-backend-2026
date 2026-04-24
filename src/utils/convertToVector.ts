import { FraudDetectionPayload } from "../schema.js";
import { CONSTANTS, MCC_RISK } from "./loadAsync.js";

const {
  max_amount: MAX_AMOUNT,
  max_installments: MAX_INSTALLMENTS,
  amount_vs_avg_ratio: AMOUNT_VS_AVG_RATIO,
  max_minutes: MAX_MINUTES,
  max_km: MAX_KM,
  max_tx_count_24h: MAX_TX_COUNT_24H,
  max_merchant_avg_amount: MAX_MERCHANT_AVG_AMOUNT,
} = CONSTANTS;

const clamp = (val: number) => Math.max(0, Math.min(1, val));

export const convertToVector = (data: FraudDetectionPayload): number[] => {
  const vector = new Array(14);

  // Desestruturação direta preserva a nomenclatura oficial do payload
  const { transaction, customer, merchant, terminal, last_transaction } = data;

  // [0] amount
  vector[0] = clamp(transaction.amount / MAX_AMOUNT);

  // [1] installments
  vector[1] = clamp(transaction.installments / MAX_INSTALLMENTS);

  // [2] amount_vs_avg (Prevenção contra divisão por zero e NaN)
  const safeAvgAmount = customer.avg_amount > 0 ? customer.avg_amount : 1;
  vector[2] = clamp(transaction.amount / safeAvgAmount / AMOUNT_VS_AVG_RATIO);

  const reqDate = new Date(transaction.requested_at);

  // [3] hour_of_day (Obrigatório o uso de UTC)
  vector[3] = reqDate.getUTCHours() / 23;

  // [4] day_of_week (Correção: JS Domingo=0. Regra: Domingo=6)
  const jsDay = reqDate.getUTCDay();
  vector[4] = (jsDay === 0 ? 6 : jsDay - 1) / 6;

  // [5] minutes_since_last_tx e [6] km_from_last_tx
  if (last_transaction === null) {
    vector[5] = -1;
    vector[6] = -1;
  } else {
    const lastDate = new Date(last_transaction.timestamp);
    const diffMinutes = (reqDate.getTime() - lastDate.getTime()) / 60000;

    vector[5] = clamp(diffMinutes / MAX_MINUTES);
    vector[6] = clamp(last_transaction.km_from_current / MAX_KM);
  }

  // [7] km_from_home
  vector[7] = clamp(terminal.km_from_home / MAX_KM);

  // [8] tx_count_24h
  vector[8] = clamp(customer.tx_count_24h / MAX_TX_COUNT_24H);

  // [9] is_online
  vector[9] = terminal.is_online ? 1 : 0;

  // [10] card_present
  vector[10] = terminal.card_present ? 1 : 0;

  // [11] unknown_merchant (Invertido lógico)
  vector[11] = customer.known_merchants.includes(merchant.id) ? 0 : 1;

  // [12] mcc_risk (Acesso O(1) com fallback direto)
  vector[12] =
    MCC_RISK[merchant.mcc] !== undefined ? MCC_RISK[merchant.mcc] : 0.5;

  // [13] merchant_avg_amount
  vector[13] = clamp(merchant.avg_amount / MAX_MERCHANT_AVG_AMOUNT);

  return vector;
};
