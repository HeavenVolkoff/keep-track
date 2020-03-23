export const parsePercentage = percentage => Number.parseFloat((percentage || "").replace("%", "").trim()) || 0
export const toPercentage = number => `${number.toFixed(2)}%`