import 'dotenv/config';
import { createServer } from './server';

const app = createServer();

export default app;

if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`[Takt BFF] Server running on http://localhost:${port}`);
  });
}
