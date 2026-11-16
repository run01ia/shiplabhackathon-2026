import { hc } from "hono/client";
import type { Hono } from "hono";

// TODO: backend の `AppType` が出来たら、ここを backend の型に置き換える (手で重複して書かない)。
// 今は仮の型。
type AppType = Hono;

export const api = hc<AppType>(import.meta.env.VITE_API_URL ?? "http://localhost:3000");
