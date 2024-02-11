import { ObjectId } from "mongodb";
import products from "./conn.mjs";
import express from "express";
import { getFiltros, getSortByDate } from "./help.mjs";
import { getClientById, getBidsByProductId, getBidWinner } from "./api.mjs";
import squedule from "node-schedule";
import axios from "axios";
import "dotenv/config";

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    const filtro = getFiltros(req);
    const sortOption = getSortByDate(req);

    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 0;

    let results = await products
      .find(filtro)
      .sort(sortOption)
      .skip(offset)
      .limit(limit)
      .toArray();
    res.send(results).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

const email_api = process.env.EMAILS_URL;

const squeduleJob = async (date, product, token) => {
  console.log("squedule the job for: ", date);
  const winner = await getBidWinner(product._id, token);
  let message = `La subasta del producto ${product.name} ha finalizado`;
  if (winner) {
    const winner_user = await getClientById(winner);
    message += ` y el ganador es el usuario ${winner_user.name}`;
    const email_winner = await axios.post(`${email_api}/send-email`, {
      to: winner_user.email,
      subject: "Subasta finalizada",
      text: `Has ganado la subasta para el producto ${product.name}.`,
    });
  } else {
    message += ` y no hubo ganador`;
    product.date = new Date();
    product.price = product.price * 0.9;
    const id = product._id;
    delete product._id;
    await updateProduct(id, product, token);
  }
  const cliente = await getClientById(product.userID);
  const email_owner = await axios.post(`${email_api}/send-email`, {
    to: cliente.email,
    subject: "Subasta finalizada",
    text: message,
  });
};

const scheduleEmail = async (product, token) => {
  console.logs;
  const date = new Date(product.date);
  date.setDate(date.getDate() + product.length);
  // date.setMinutes(date.getMinutes() + 1); for testing

  const job = squedule.scheduleJob(date, () =>
    squeduleJob(date, product, token)
  );
};

app.post("/", async (req, res) => {
  try {
    const product = req.body;
    const result = await products.insertOne({
      ...product,
      date: new Date(),
      payed: false,
    });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.get("/:id", async (req, res) => {
  try {
    const result = await products.findOne({ _id: new ObjectId(req.params.id) });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.delete("/:id", async (req, res) => {
  try {
    const result = await products.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.put("/:id", async (req, res) => {
  try {
    const { _id, ...product } = req.body;

    const result = await updateProduct(
      req.params.id,
      product,
      req.headers.authorization
    );

    // Check if the product was updated successfully
    if (result && result.modifiedCount > 0) {
      const updatedProduct = await getProductById(req.params.id);
      res.json(updatedProduct).status(200);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (e) {
    console.error("Error updating product:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const updateProduct = async (id, product, token) => {
  const result = await products.updateOne(
    { _id: new ObjectId(id) },
    { $set: product }
  );
  if (product.date && product.length) {
    scheduleEmail(product, token);
  }
  return result;
};

const getProductById = async (id) => {
  // Add logic to fetch and return the updated product by ID
  return await products.findOne({ _id: new ObjectId(id) });
};

app.get("/:id/cliente", async (req, res) => {
  try {
    const result = await products.findOne({ _id: new ObjectId(req.params.id) });
    const cliente = await getClientById(result.userID);
    res.send(cliente).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.get("/:id/pujas", async (req, res) => {
  try {
    const pujas = await getBidsByProductId(req.params.id);
    res.send(pujas).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

export default app;
