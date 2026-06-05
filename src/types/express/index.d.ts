declare namespace Express {
  export interface Request {
    id?: string;
    idempotencyKey?: string;
  }
}
