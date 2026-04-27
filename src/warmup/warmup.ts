import { convertToVector } from "../utils/convertToVector.js";
import { searchItemsByVector } from "../utils/searchByVector.js";

export const warmup = () => {
  const fakeData = {
    transaction: {
      amount: 100,
      installments: 1,
      requested_at: new Date().toISOString(),
    },
    customer: {
      avg_amount: 50,
      tx_count_24h: 1,
      known_merchants: [],
    },
    merchant: {
      id: "1",
      mcc: "1234",
      avg_amount: 50,
    },
    terminal: {
      km_from_home: 1,
      is_online: true,
      card_present: true,
    },
    last_transaction: null,
  };

  for (let i = 0; i < 1000; i++) {
    const v = convertToVector(fakeData as any);
    searchItemsByVector(v);
  }
};
