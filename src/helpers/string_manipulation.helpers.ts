import {
  greenAnsiColor,
  redAnsiColor,
  yellowAnsiColor,
} from "../configs/logger.configs";

export const incrementString = (admission_string: string): string => {
  const number = Number(admission_string) + 1;
  let str = number.toString();

  while (str.length < admission_string.length) {
    str = "0" + str;
  }

  return str;
};

export const removeNumbersFunc = (input: string): string => {
  const hasNumber = /\d/.test(input);

  if (!hasNumber) {
    return input as string;
  }

  const result = input.replaceAll(/\d+/g, "");
  return result.trim() as string;
};

export const extractTokenValue = (token: string): string => {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }

  const tokenParts = token.split("_");
  if (tokenParts.length < 3) {
    throw new Error('Token must have at least 3 parts separated by "_"');
  }

  return tokenParts.slice(2).join("_");
};

export const formatStringToDBName = <T extends string = string>(
  str: string
): T =>
  str
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "")
    .replaceAll("+", "_")
    .replaceAll("-", "_") as T;

export const formatStringToDBFormat = <T extends string = string>(
  str: string,
  remain: boolean = false
): T => {
  const text = str
    .trim()
    // .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll("+", "_")
    .replaceAll("-", "_") as T;

  return remain ? text : (text.toLowerCase() as T);
};

export const toTwoDigits = (num: number) => num.toString().padStart(2, "0");

export const incrementLastSection = (personnel_id: string): string => {
  const parts = personnel_id.split("_");
  const lastSection = parts.pop();

  const incremented = incrementString(lastSection!);
  return `${parts.join("_")}_${incremented}`;
};

export const validateSession = (session: string) => {
  // Get the current year
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;

  // Expected formats: "previousYear - currentYear" or "currentYear - nextYear"
  const validSession1 = `${previousYear} - ${currentYear}`;
  const validSession2 = `${currentYear} - ${nextYear}`;

  // Check if the session matches either valid format
  if (session !== validSession1 && session !== validSession2) {
    throw new Error(
      `Session must be either "${validSession1}" or "${validSession2}"`
    );
  }

  return true; // Return true if validation passes
};

export const colorizeStatus = (status: number): string => {
  if (status >= 500) {
    return redAnsiColor(status);
  } else if (status >= 400) {
    return yellowAnsiColor(status);
  }
  return greenAnsiColor(status);
};

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
