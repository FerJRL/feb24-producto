import axios from "axios";
import "dotenv/config";

const clients = process.env.CLIENTS_URL;

export async function getFiltros(req) {
  let filtros = {};
  const queries = req.query;
  if (queries.description || queries.name) {
    filtros = {
      $or: [
        { description: { $regex: queries.description, $options: "i" } },
        { name: { $regex: queries.name, $options: "i" } },
      ],
    };
  }
  if (queries.price) {
    filtros = {
      ...filtros,
      price: parseFloat(queries.price),
    };
  }
  if (queries.userID) {
    filtros = {
      ...filtros,
      userID: queries.userID,
    };
  }
  if (queries.long && queries.lat && queries.radius) {
    const clientPetition = await axios.get(
      `${clients}/v1/?lat=${req.query.lat}&long=${req.query.long}&radius=${req.query.radius}`, {
        headers: {
            "Authorization": req.headers.authorization
        }
      }
    );
    // make a list with the ids of the clients in order to add them to the filter
    const clientIds = clientPetition.data.map((client) => client._id);

    filtros = {
      ...filtros,
      userID: { $in: clientIds },
    };
  }
  return filtros;
}

export function getSortByDate(req) {
  const sortByDate = req.query.sortByDate;
  if (sortByDate) {
    if (sortByDate === "asc") return { date: 1 };
    if (sortByDate === "desc") return { date: -1 };
  }
  return {};
}
