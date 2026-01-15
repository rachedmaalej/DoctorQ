// Production-safe logger utility
// Only logs in development mode to reduce bundle size and improve performance

const isDev = import.meta.env.DEV;

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  debug: isDev ? console.debug.bind(console) : () => {},
};

export default logger;
