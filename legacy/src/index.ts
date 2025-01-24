import express from 'express';
import type { Request, Response, RequestHandler } from 'express';

const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;

interface Item {
  id: number;
  name: string;
}

type CreateItemRequest = {
  name?: string;
};

type ErrorResponse = {
  error: string;
};

// Type-safe request handlers
type GetItemsHandler = RequestHandler<Record<string, never>, Item[], Record<string, never>>;
type CreateItemHandler = RequestHandler<Record<string, never>, Item | ErrorResponse, CreateItemRequest>;

app.use(express.json());

router.get('/', ((_req, res) => {
  res.json({ message: 'Hello from Legacy Express.js!' });
}) as RequestHandler);

router.get('/api/items', ((req, res) => {
  const items: Item[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));
  res.json(items);
}) as GetItemsHandler);

router.post('/api/items', ((req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  res.status(201).json({
    id: Date.now(),
    name,
  });
}) as CreateItemHandler);

app.use(router);

app.listen(port, () => {
  console.log(`Legacy server running at http://localhost:${port}`);
}); 