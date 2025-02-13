import hash from "hash.js";

export const sha256 = (data: string): string => {
  return hash.sha256().update(data).digest("hex");
};
