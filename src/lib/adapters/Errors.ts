export class NotFoundError extends Error {
  code: number = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InvalidFileError extends Error {
  code: number = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidFileError";
  }
}

export class NotSupportedPlatformError extends Error {
  code: number = 400;
  constructor(message: string) {
    super(message);
    this.name = "NotSupportedPlatformError";
  }
}

export type AdapterError =
  | NotFoundError
  | InvalidFileError
  | NotSupportedPlatformError;
