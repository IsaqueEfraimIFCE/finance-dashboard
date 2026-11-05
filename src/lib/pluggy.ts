import { PluggyClient } from "pluggy-sdk";

let client: PluggyClient | null = null;

function getClient(): PluggyClient {
  if (!client) {
    client = new PluggyClient({
      clientId: process.env.PLUGGY_CLIENT_ID!,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
    });
  }
  return client;
}

export const pluggyClient = new Proxy({} as PluggyClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
