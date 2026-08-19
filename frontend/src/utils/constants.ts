export const calculateMarginRate = (priceVal: number, costVal: number): number => {
  if (priceVal <= 0) return 0;
  return ((priceVal - costVal) / priceVal) * 100;
};