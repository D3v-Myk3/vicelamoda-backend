import { Request } from "express";

export const getProtocol = (req: Request): string => {
  const forwardedProto = req.get("X-Forwarded-Proto");
  // logger.info(`X-Forwarded-Proto:, ${forwardedProto}`);
  if (forwardedProto) {
    return forwardedProto.split(",")[0];
  }
  // logger.info(`req.secure:, ${req.secure}`);

  return req.secure ? "https" : "http";
};
