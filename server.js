import express from 'express';

import bindRoutes from './routes';

const SERVER_PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

bindRoutes(app);

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});

export default app;
