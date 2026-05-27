import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import 'dotenv/config';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defaultUserProfile } from './server/user-profile';
import { userServices } from './server/user-services';
import { MongoAuth } from './server/mongoauth';

const browserDistFolder = join(import.meta.dirname, '../browser');

function resolveViewsDir(): string {
  const candidates = [
    join(import.meta.dirname, 'views'),
    join(import.meta.dirname, '../views'),
    join(import.meta.dirname, '../browser/views'),
    join(process.cwd(), 'src/views'),
    join(process.cwd(), 'dist/hospital-management/server/views'),
    join(process.cwd(), 'dist/hospital-management/browser/views'),
  ];

  return candidates.find((path) => existsSync(path)) ?? join(process.cwd(), 'src/views');
}

const viewsDir = resolveViewsDir();
const app = express();
const mongo = new MongoAuth()

app.set('view engine', 'pug');
app.set('views', viewsDir);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.get('/user', (_req, res) => {
  res.render('user', {
    services: userServices,
    profile: defaultUserProfile,
    year: new Date().getFullYear(),
  });
});

app.post('/login', async (req, res) => {
  mongo.loginUser(req.body, res) as any;
});

app.post('/register', async (req, res) => {
  mongo.registerUser(req.body, res) as any;
});

const angularApp = new AngularNodeAppEngine();

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log(`User dashboard available at http://localhost:${port}/user`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
