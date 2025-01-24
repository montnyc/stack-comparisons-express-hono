import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();
const port = Number(process.env.PORT) || 3001;

// Zod schemas for validation
const ItemSchema = z.object({
  id: z.number(),
  name: z.string().min(1)
});

const CreateItemSchema = z.object({
  name: z.string().min(1)
});

type Item = z.infer<typeof ItemSchema>;

app.use('*', logger());

app.get('/', (c) => c.json({ 
  message: 'Hello from Modern Hono!',
  timestamp: new Date().toISOString()
}));

app.get('/api/items', (c) => {
  const items: Item[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));
  return c.json(items);
});

app.post(
  '/api/items',
  zValidator('json', CreateItemSchema),
  async (c) => {
    const { name } = c.req.valid('json');
    return c.json(
      { 
        id: Date.now(),
        name 
      },
      201
    );
  }
);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Modern server running at http://localhost:${info.port}`);
}); 