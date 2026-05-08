import { serve } from "@hono/node-server";

import { createApp } from "./routes.js";
import { createSeededStore } from "./seed.js";

const port = Number(process.env.PORT ?? 8787);

serve({
  fetch: createApp(createSeededStore()).fetch,
  port,
});

console.log(`SkillGuard API listening on http://localhost:${port}`);
