export const ok = <T>(message: string, data?: T, pagination?: unknown) => ({
  success: true,
  message,
  data,
  pagination
});

export const fail = (message: string, data?: unknown) => ({
  success: false,
  message,
  data
});
