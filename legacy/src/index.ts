import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

interface Item {
  id: number;
  name: string;
}

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Legacy Express.js!' });
});

app.get('/api/items', (_req: Request, res: Response) => {
  const items: Item[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));
  res.json(items);
});

app.post('/api/items', (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  res.status(201).json({
    id: Date.now(),
    name,
  });
});

app.listen(port, () => {
  console.log(`Legacy server running at http://localhost:${port}`);
}); 