// ============= Result Type Utilities =============
// Clean handling of success/error union types

export type Ok<T = any> = { ok: true; mode?: "resend" | "stub" } & T;
export type Err = { ok: false; error: string };
export type Result<T = any> = Ok<T> | Err;

export function isErr<T>(x: Ok<T> | Err): x is Err { 
  return (x as Err).ok === false; 
}

export function isOk<T>(x: Ok<T> | Err): x is Ok<T> { 
  return (x as Ok<T>).ok === true; 
}

export function getError(x: Ok | Err): string | undefined {
  return isErr(x) ? x.error : undefined;
}