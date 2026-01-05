// src/shared/config.ts

export const IS_INTEGRATION =
  import.meta.env.VITE_INTEGRATION_MODE === 'true';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '';
