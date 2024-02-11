import express from "express";
import v1 from "./v1.mjs";
import v2 from "./v2.mjs";
import cors from "cors";
import axios from "axios";
import { ObjectId } from "mongodb";
import products from "./conn.mjs";

const app = express();
const port = 5001;

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});

const clients = process.env.CLIENTS_URL;

const verifyToken = async (req, res, next) => {
  try {
    if (req.method != "GET") {
      const response = await axios.get(`${clients}/checkToken/${req.headers.authorization}`);
      const user = response.data.user;

      if (req.params.id != null) {
        const product = await products.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (product.userID != user._id) {
          res.status(402).send("Unauthorized action");
          return;
        } else if (req.params.id1 != undefined && req.params.id2 != undefined) {
          if (req.params.id1 != user._id && req.params.id2 != user._id) {
            res.status(402).send("Unauthorized action");
            return;
          }
        }
      } else if (req.method == "POST" && req.body.userID != user._id) {
        res.status(402).send("Unauthorized action");
        return;
      }
    }

    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
};

app.use("/v1", verifyToken, v1);
app.use("/v2", verifyToken, v2);
