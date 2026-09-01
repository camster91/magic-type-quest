export function getGoogleApiKey(env = process.env) {
  const key = env.GOOGLE_IMAGEN_API_KEY?.trim();
  if (!key) {
    throw new Error('Set GOOGLE_IMAGEN_API_KEY before running Google AI asset tools.');
  }
  return key;
}
