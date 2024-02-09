import path from "path";

export const HOST = process.env.HOST as string;
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
