const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.myfzpsp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const hotelServiceCollection = client
      .db('stayHotelDB')
      .collection('services');
    const userCollection = client.db('stayHotelDB').collection('user');
    const bookingCollection = client.db('stayHotelDB').collection('bookings');
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '2h',
      });
      res.send({ token });
    });

    app.get('/services', async (req, res) => {
      const cursor = hotelServiceCollection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const services = await hotelServiceCollection.findOne(query);
      res.send(services);
    });

    app.post('/services', async (req, res) => {
      const service = req.body;
      const result = await hotelServiceCollection.insertOne(service);
      res.send(result);
    });
    app.post('/users', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const alradyEmail = await userCollection.findOne(query);
      if (alradyEmail) {
        return res.send({ message: 'Email already exists' });
      }
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get('/booking', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send({
        data: result,
        count: await cursor.count(),
        status: 'pandding',
      });
    });
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
