import { ObjectId } from "mongodb";
import products from "./conn.mjs";
import express from "express";
import { getFiltros, getSortByDate } from "./help.mjs";
import { getClientById } from "./api.mjs";
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

export default app;
