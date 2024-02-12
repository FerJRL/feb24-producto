import { ObjectId } from "mongodb";
import sofas from "./conn.mjs";
import express from "express";
import { getFiltros, getSortByDate } from "./help.mjs";
import { getClientById } from "./api.mjs";
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

    let results = await sofas
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
    const sofa = req.body;
    const result = await sofas.insertOne({
      ...sofa
    });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.get("/:id", async (req, res) => {
  try {
    const result = await sofas.findOne({ _id: new ObjectId(req.params.id) });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.delete("/:id", async (req, res) => {
  try {
    const result = await sofas.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

app.put("/:id", async (req, res) => {
  try {
    const { _id, ...sofa } = req.body;

    const result = await updateSofa(
      req.params.id,
      sofa,
      req.headers.authorization
    );

    // Check if the sofa was updated successfully
    if (result && result.modifiedCount > 0) {
      const updatedSofa = await getSofaById(req.params.id);
      res.json(updatedSofa).status(200);
    } else {
      res.status(404).json({ error: "Sofa not found" });
    }
  } catch (e) {
    console.error("Error updating sofa:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const updateSofa = async (id, sofa, token) => {
  const result = await sofas.updateOne(
    { _id: new ObjectId(id) },
    { $set: sofa }
  );
  
  return result;
};

const getSofaById = async (id) => {
  // Add logic to fetch and return the updated sofa by ID
  return await sofas.findOne({ _id: new ObjectId(id) });
};

app.get("/:id/cliente", async (req, res) => {
  try {
    const result = await sofas.findOne({ _id: new ObjectId(req.params.id) });
    const cliente = await getClientById(result.userID);
    res.send(cliente).status(200);
  } catch (e) {
    res.send(e).status(500);
  }
});

export default app;
