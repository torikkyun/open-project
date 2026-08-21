export function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^([0-9]+)([smhd])$/);
  if (!match) {
    throw new Error(
      "Invalid expiration format. Use digits followed by s, m, h, or d.",
    );
  }

  const [, value, unit] = match;
  const amount = Number(value);

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return amount * 1000;
  }
}
