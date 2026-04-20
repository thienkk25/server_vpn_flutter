export const PRODUCT_PRICES: Record<string, number> = {
  'premium_weekly_tt': 1.99,
  'premium_monthly_tt': 4.99,
  'premium_yearly_tt': 24.99,
  'premium_lifetime_test': 49.00
};

export const getPriceForProduct = (productId: string): number => {
  return PRODUCT_PRICES[productId] || 0;
};
