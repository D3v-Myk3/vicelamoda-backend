import { CustomResponse, DefaultErrorReturnObj } from "./general.types";

/* export type ErrorResponse<T = null> = {
  data: T;
  status: number;
  errorMessage: string;
  source: string;
}; */
export type ErrorResponse<T = null> = {
  data: T;
  status: number;
  errorMessage: string;
  source: string;
};

export type HandleErrorReturn = DefaultErrorReturnObj<null>;

export type ErrorProps<T = string> = {
  response: DefaultErrorReturnObj<T>;
  res: CustomResponse<null>;
  error: CustomError | Error;
  source: string;
  status: number;
};

// export type ErrorHandlerReturn = Omit<ErrorResponse<null>, "status"> | null;
export type ErrorHandlerReturn = DefaultErrorReturnObj<null> | void;

export type DefaultErrorReturn = DefaultErrorReturnObj<null>;

/* export type HandleError<T> = (
  response: Partial<ErrorResponse<T>>,
  res: Response | null,
  error: Error | null
) => Omit<ErrorResponse, "status"> | null; */

export class CustomError extends Error {
  public data: null;
  public errorMessage: string | null;
  public source: string;
  public status: number;

  constructor({ data, errorMessage, source, status }: DefaultErrorReturnObj) {
    super(errorMessage || "An error occurred"); // Pass errorMessage to Error's constructor
    this.data = data;
    this.errorMessage = errorMessage;
    this.source = source;
    this.status = status;

    // Ensure the name property is set correctly for the error instance
    Object.defineProperty(this, "name", {
      value: "CustomError",
      writable: false,
    });
  }
}
