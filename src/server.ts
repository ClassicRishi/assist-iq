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
import { FirstAid } from './server/firstaid';
import { foodItems } from './server/food-delivery';
import { mechanicShops } from './server/mechanic-shops';
import { db, MongoAuth } from './server/mongoauth';
import services from './server/notification';
import { policeStations } from './server/police-stations';
import { userServices } from './server/user-services';

let LoginedEmail = "" as any;

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

app.post('/login', (req, res) => {
  LoginedEmail = req.body.email;
  services.Ambulance(req.body).then(ambulance => {
    services.Burns(req.body).then(burns => {
      services.CPR(req.body).then(cpr => {
        services.Cuts(req.body).then(cuts => {
          services.Fracture(req.body).then(fracture => {
            mongo.loginUser(req.body, res, burns, ambulance, cpr, cuts, fracture) as any;
          })
        })
      })
    })
  })
});

app.get('/mechanic-back', async (req, res) => {
  const collection = db.collection('users');
  const doc = await collection.find({ email: LoginedEmail }).toArray()
  services.Ambulance(doc).then(ambulance => {
    services.Burns(doc).then(burns => {
      services.CPR(doc).then(cpr => {
        services.Cuts(doc).then(cuts => {
          services.Fracture(doc).then(fracture => {
            res.render("user.pug", { profile: doc[0], services: userServices, burns, ambulance, cpr, cuts, fracture });
          })
        })
      })
    })
  })
});

app.get('/police-back', async (req, res) => {
  const collection = db.collection('users');
  const doc = await collection.find({ email: LoginedEmail }).toArray()
  services.Ambulance(doc).then(ambulance => {
    services.Burns(doc).then(burns => {
      services.CPR(doc).then(cpr => {
        services.Cuts(doc).then(cuts => {
          services.Fracture(doc).then(fracture => {
            res.render("user.pug", { profile: doc[0], services: userServices, burns, ambulance, cpr, cuts, fracture });
          })
        })
      })
    })
  })
})

app.post('/register', async (req, res) => {
  LoginedEmail = req.body.email
  services.Ambulance(req.body).then(ambulance => {
    services.Burns(req.body).then(burns => {
      services.CPR(req.body).then(cpr => {
        services.Cuts(req.body).then(cuts => {
          services.Fracture(req.body).then(fracture => {
            mongo.registerUser(req.body, res, burns, ambulance, cpr, cuts, fracture) as any;
          })
        })
      })
    })
  })
});

app.get('/police-stations', (_req, res) => {
  res.render('police-stations', { stations: policeStations });
})

app.get('/food-delievery', (_req, res) => {
  console.log(LoginedEmail);
  res.render('food-delivery', { foods: foodItems, email: LoginedEmail });
})

app.get('/food-back', async (_req, res) => {
  const collection = db.collection('users');
  const doc = await collection.find({ email: LoginedEmail }).toArray();
  services.Ambulance(doc).then(ambulance => {
    services.Burns(doc).then(burns => {
      services.CPR(doc).then(cpr => {
        services.Cuts(doc).then(cuts => {
          services.Fracture(doc).then(fracture => {
            res.render('user.pug', {
              profile: doc[0],
              services: userServices,
              burns,
              ambulance,
              cpr,
              cuts,
              fracture,
            });
          });
        });
      });
    });
  });
})

app.post('/add-to-cart', (req, res) => {
  const collection = db.collection('carts');
  const item = {
    foodname: req.body.foodname,
    hotelname: req.body.hotelname,
    price: Number(req.body.price) || 0,
    quantity: Number(req.body.quantity) || 1,
    latitude: Number(req.body.latitude) || 0,
    longitude: Number(req.body.longitude) || 0,
    image_url: req.body.image_url || '/foodie.png'
  };

  collection.insertOne({ email: LoginedEmail, item });
  res.render('food-delivery', { foods: foodItems, email: LoginedEmail });
})

// Cart page route - displays user's cart items
app.get('/my-cart', async (req, res) => {
  const cartCollection = db.collection('carts');
  const foodCollection = db.collection('foods');
  const cartDocs = await cartCollection.find({ email: LoginedEmail }).toArray();

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

  res.render('user-cart', { email: LoginedEmail, cartItems });
})

app.get('/food-delivery', (req, res) => {
  res.render('food-delivery', { foods: foodItems, email: LoginedEmail });
})

app.post('/delete-item', async (req, res) => {
  const doc = JSON.parse(req.body.cartIndex)
  const collection = db.collection("carts");
  await collection.deleteOne({ email: LoginedEmail, 'item.foodname': doc['foodname'] })

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

app.get('/first-aid', (req, res) => {
  res.render("firstaid", { LoginedEmail })
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