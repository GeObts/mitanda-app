export const bad = (error: string, status = 400) =>
  Response.json({ error }, { status });

export const nowSec = () => Math.floor(Date.now() / 1000);
