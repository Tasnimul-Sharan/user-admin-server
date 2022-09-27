require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// const dbConnect = require("./utils/dbConnect");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// console.log(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oc8wxpz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("adminPanel").collection("users");
    const usersInfoCollection = client.db("adminPanel").collection("usersInfo");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requestCount = await userCollection.findOne({ email: requester });
      if (requestCount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden" });
      }
    };

    app.get("/users", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.get("/usersInfo", verifyJWT, verifyAdmin, async (req, res) => {
      const allUserInfo = await usersInfoCollection.find().toArray();
      res.send(allUserInfo);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5h" }
      );
      res.send({ result, token });
    });

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/usersInfo", async (req, res) => {
      const users = req.body;
      const result = await usersInfoCollection.insertOne(users);
      res.send(result);
    });

    app.delete("/usersInfo/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersInfoCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.render("home.ejs", {
    id: "631c48080f745a70fc78032b",
    user: {
      name: "Tasnim Ahmed",
      member: "Abdul Korim",
      date: "2022-09-17",
      time: "15:11",
    },
    id2: "631c48cb0f745a70fc78032d",
    user2: {
      name: "Mohona Alam",
      member: "Omar Faruk",
      date: "2022-09-14",
      time: "16:20",
    },
    id3: "6631c4a050f745a70fc780330",
    user3: {
      name: "Ashraf Romon",
      member: "Abdul Rahim",
      date: "2022-09-22	",
      time: "18:25",
    },
    id4: "631c49100f745a70fc78032e",
    user4: {
      name: "Asma Khanm",
      member: "Abu Bokkor",
      date: "2022-09-14",
      time: "17:21",
    },
    id5: "631c49540f745a70fc78032f",
    user5: {
      name: "Shah Alam",
      member: "Ahmed Kabir",
      date: "2022-09-21",
      time: "17:22",
    },
  });
});

app.listen(port, () => {
  console.log(`User Admin website is running on ${port}`);
});
