export const withoutEmpty = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_key, value]) => Boolean(value))
  );

