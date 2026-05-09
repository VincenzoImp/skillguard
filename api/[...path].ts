import { handle } from "@hono/node-server/vercel";
import { Hono } from "hono";

import { createApp } from "../apps/api/src/routes.js";
import { createSeededStore } from "../apps/api/src/seed.js";
import type { SkillGuardStore } from "../apps/api/src/store.js";

declare global {
  // eslint-disable-next-line no-var
  var skillguardStore: SkillGuardStore | undefined;
}

const store = (globalThis.skillguardStore ??= createSeededStore());
const api = createApp(store);
const app = new Hono().route("/api", api);

export default handle(app);
