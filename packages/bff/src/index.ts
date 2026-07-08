import { createServer } from './server';

const port = process.env.PORT || 3000;
const app = createServer();

app.listen(port, () => {
  console.log(`[Takt BFF] Server running on http://localhost:${port}`);
});
