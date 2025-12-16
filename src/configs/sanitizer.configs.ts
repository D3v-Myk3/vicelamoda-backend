import { MatchedDataOptions } from "express-validator";

export const matchedDataOption: Partial<MatchedDataOptions> = {
  includeOptionals: true,
  onlyValidData: true,
  locations: ["headers", "body", "params", "query"],
};

export const matchedHeadersDataOption: Partial<MatchedDataOptions> = {
  includeOptionals: true,
  onlyValidData: true,
  locations: ["headers"],
};

export const matchedBodyDataOption: Partial<MatchedDataOptions> = {
  includeOptionals: true,
  onlyValidData: true,
  locations: ["body"],
};

export const matchedParamsDataOption: Partial<MatchedDataOptions> = {
  includeOptionals: true,
  onlyValidData: true,
  locations: ["params"],
};

export const matchedQueryDataOption: Partial<MatchedDataOptions> = {
  includeOptionals: true,
  onlyValidData: true,
  locations: ["query"],
};
