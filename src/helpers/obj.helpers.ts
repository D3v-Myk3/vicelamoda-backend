export const getObjectKeysFromArray = <
  T extends Record<string, unknown>,
  K extends readonly string[],
>(
  keys: K,
  obj: T
): Array<Extract<keyof T, K[number]> & string> => {
  if (!Array.isArray(keys) || typeof obj !== "object" || obj === null) {
    return [];
  }

  return keys.filter((key): key is Extract<keyof T, K[number]> & string =>
    Object.prototype.hasOwnProperty.call(obj, key)
  );
};
