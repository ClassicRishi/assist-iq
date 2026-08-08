import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import 'dotenv/config';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getLoggedInEmail, loginWithFirebase, registerWithFirebase, setLoggedInEmail } from './server/firebase-auth';
import { FirstAid } from './server/firstaid';
import { foodItems } from './server/food-delivery';
import { mechanicShops } from './server/mechanic-shops';
import { db, MongoAuth } from './server/mongoauth';
import services from './server/notification';
import { policeStations } from './server/police-stations';
import { userServices } from './server/user-services';

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
const firstaid = new FirstAid()

async function renderUserDashboard(res: express.Response, email: string) {
  const collection = db.collection('users');
  const doc = await collection.find({ email }).toArray();

  if (!doc[0]) {
    res.redirect('/');
    return;
  }

  const userData = doc[0];
  const currentUser = { email };
  const ambulance = await services.Ambulance(currentUser);
  const burns = await services.Burns(currentUser);
  const cpr = await services.CPR(currentUser);
  const cuts = await services.Cuts(currentUser);
  const fracture = await services.Fracture(currentUser);

  res.render('user.pug', {
    profile: userData,
    services: userServices,
    burns,
    ambulance,
    cpr,
    cuts,
    fracture,
    year: new Date().getFullYear(),
  });
}

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

app.post('/login', async (req, res) => {
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '');

  const authResult = await loginWithFirebase(email, password);
  if (!authResult.ok) {
    res.send(authResult.message);
    return;
  }

  setLoggedInEmail(authResult.email);
  const loggedEmail = getLoggedInEmail();

  services.Ambulance({ ...req.body, email: loggedEmail }).then(ambulance => {
    services.Burns({ ...req.body, email: loggedEmail }).then(burns => {
      services.CPR({ ...req.body, email: loggedEmail }).then(cpr => {
        services.Cuts({ ...req.body, email: loggedEmail }).then(cuts => {
          services.Fracture({ ...req.body, email: loggedEmail }).then(fracture => {
            mongo.loginUser({ ...req.body, email: loggedEmail }, res, burns, ambulance, cpr, cuts, fracture) as any;
          });
        });
      });
    });
  });
});

app.get('/user', async (_req, res) => {
  const loggedEmail = getLoggedInEmail();

  if (!loggedEmail) {
    res.redirect('/');
    return;
  }

  await renderUserDashboard(res, loggedEmail);
});

app.get('/mechanic-back', async (req, res) => {
  const collection = db.collection('users');
  const loggedEmail = getLoggedInEmail();
  const doc = await collection.find({ email: loggedEmail }).toArray();
  const currentUser = { email: loggedEmail };
  services.Ambulance(currentUser).then(ambulance => {
    services.Burns(currentUser).then(burns => {
      services.CPR(currentUser).then(cpr => {
        services.Cuts(currentUser).then(cuts => {
          services.Fracture(currentUser).then(fracture => {
            res.render("user.pug", { profile: doc[0], services: userServices, burns, ambulance, cpr, cuts, fracture, year: new Date().getFullYear() });
          })
        })
      })
    })
  })
});

app.get('/police-back', async (req, res) => {
  const collection = db.collection('users');
  const loggedEmail = getLoggedInEmail();
  const doc = await collection.find({ email: loggedEmail }).toArray();
  const currentUser = { email: loggedEmail };
  services.Ambulance(currentUser).then(ambulance => {
    services.Burns(currentUser).then(burns => {
      services.CPR(currentUser).then(cpr => {
        services.Cuts(currentUser).then(cuts => {
          services.Fracture(currentUser).then(fracture => {
            res.render("user.pug", { profile: doc[0], services: userServices, burns, ambulance, cpr, cuts, fracture, year: new Date().getFullYear() });
          })
        })
      })
    })
  })
})

app.post('/register', async (req, res) => {
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '');

  const authResult = await registerWithFirebase(email, password);
  if (!authResult.ok) {
    res.send(authResult.message);
    return;
  }

  setLoggedInEmail(authResult.email);
  const loggedEmail = getLoggedInEmail();

  services.Ambulance({ ...req.body, email: loggedEmail }).then(ambulance => {
    services.Burns({ ...req.body, email: loggedEmail }).then(burns => {
      services.CPR({ ...req.body, email: loggedEmail }).then(cpr => {
        services.Cuts({ ...req.body, email: loggedEmail }).then(cuts => {
          services.Fracture({ ...req.body, email: loggedEmail }).then(fracture => {
            mongo.registerUser({ ...req.body, email: loggedEmail }, res, burns, ambulance, cpr, cuts, fracture) as any;
          });
        });
      });
    });
  });
});

app.get('/police-stations', (_req, res) => {
  res.render('police-stations', { stations: policeStations });
})

app.get('/food-delievery', (_req, res) => {
  const loggedEmail = getLoggedInEmail();
  console.log(loggedEmail);
  res.render('food-delivery', { foods: foodItems, email: loggedEmail });
})

app.get('/food-back', async (_req, res) => {
  const collection = db.collection('users');
  const loggedEmail = getLoggedInEmail();
  const doc = await collection.find({ email: loggedEmail }).toArray();
  const currentUser = { email: loggedEmail };
  services.Ambulance(currentUser).then(ambulance => {
    services.Burns(currentUser).then(burns => {
      services.CPR(currentUser).then(cpr => {
        services.Cuts(currentUser).then(cuts => {
          services.Fracture(currentUser).then(fracture => {
            res.render('user.pug', {
              profile: doc[0],
              services: userServices,
              burns,
              ambulance,
              cpr,
              cuts,
              fracture,
              year: new Date().getFullYear(),
            });
          });
        });
      });
    });
  });
})

app.post('/add-to-cart', (req, res) => {
  const collection = db.collection('carts');
  const loggedEmail = getLoggedInEmail();
  const item = {
    foodname: req.body.foodname,
    hotelname: req.body.hotelname,
    price: Number(req.body.price) || 0,
    quantity: Number(req.body.quantity) || 1,
    latitude: Number(req.body.latitude) || 0,
    longitude: Number(req.body.longitude) || 0,
    image_url: req.body.image_url || '/foodie.png'
  };

  collection.insertOne({ email: loggedEmail, item });
  res.render('food-delivery', { foods: foodItems, email: loggedEmail });
})

// Cart page route - displays user's cart items
app.get('/my-cart', async (req, res) => {
  const cartCollection = db.collection('carts');
  const foodCollection = db.collection('foods');
  const loggedEmail = getLoggedInEmail();
  const cartDocs = await cartCollection.find({ email: loggedEmail }).toArray();

  const cartItems = await Promise.all(
    cartDocs.map(async (doc) => {
      const item = doc?.['item'] || {};
      let latitude = item.latitude;
      let longitude = item.longitude;

      if (
        latitude === undefined || latitude === null || latitude === '' ||
        longitude === undefined || longitude === null || longitude === ''
      ) {
        const foodDoc = await foodCollection.findOne({
          foodname: item.foodname,
          hotelname: item.hotelname,
        });

        if (foodDoc) {
          latitude = foodDoc['latitude'];
          longitude = foodDoc['longitude'];
        }
      }

      return {
        foodname: item.foodname,
        hotelname: item.hotelname,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        image_url: item.image_url || '/foodie.png',
      };
    }),
  );

  res.render('user-cart', { email: loggedEmail, cartItems });
})

app.get('/food-delivery', (req, res) => {
  const loggedEmail = getLoggedInEmail();
  res.render('food-delivery', { foods: foodItems, email: loggedEmail });
})

app.post('/delete-item', async (req, res) => {
  const loggedEmail = getLoggedInEmail();
  const doc = JSON.parse(req.body.cartIndex)
  const collection = db.collection("carts");
  await collection.deleteOne({ email: loggedEmail, 'item.foodname': doc['foodname'] })

  res.send("Deleted !!")
})

app.post('/savechanges', (req, res) => {
  const updateduser = req.body;
  services.Ambulance(req.body).then(ambulance => {
    services.Burns(req.body).then(burns => {
      services.CPR(req.body).then(cpr => {
        services.Cuts(req.body).then(cuts => {
          services.Fracture(req.body).then(fracture => {
            mongo.updateUser(req.body, res, burns, ambulance, cpr, cuts, fracture) as any;
          })
        })
      })
    })
  })
})

app.get('/logout', (_req, res) => {
  setLoggedInEmail('');
  res.redirect('/');
});

app.get('/first-aid', (req, res) => {
  res.render('firstaid', { LoginedEmail: getLoggedInEmail() })
})

app.get('/firstaid/response/added', (_req, res) => {
  const responders = [
    'Nurse Priya Nair',
    'Paramedic Arjun Mehta',
    'Dr. Kavya Rao',
    'Responder Ayaan Khan',
    'Medic Sneha Patel',
  ];
  const responderName = responders[Math.floor(Math.random() * responders.length)];

  res.render('firstaid-response-added', { responderName });
});

// first aid services
app.post('/cpr-form/submit', (req, res) => {
  firstaid.addCPR(req.body, res);
})

app.post('/cuts-form/submit', (req, res) => {
  firstaid.addCuts(req.body, res);
})

app.post('/burns-form/submit', (req, res) => {
  firstaid.addBurns(req.body, res);
})

app.post('/ambulance-form/submit', (req, res) => {
  firstaid.addAmbulance(req.body, res);
})

app.post('/fracture-form/submit', (req, res) => {
  firstaid.addFracture(req.body, res);
})

// Mechanic
app.get('/mechanic-service', (req, res) => {
  res.render("mechanic")
})

app.get('/mechanic-service/map', (_req, res) => {
  res.render('mechanic-map', { shops: mechanicShops });
})

const angularApp = new AngularNodeAppEngine();

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log("Backend is running !!!!");
    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log(`User dashboard available at http://localhost:${port}/user`);
  });

export const reqHandler = createNodeRequestHandler(app)