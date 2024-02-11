import axios from "axios";
import "dotenv/config";

const urlCliente = process.env.CLIENTS_URL;

export const getClientById = async (id) => {
  const response = await axios.get(`${urlCliente}/v1/${id}`, {
    headers: {
      Authorization: process.env.GOOGLE_CLIENT_ID,
    },
  });
  return response.data;

  //commentary
};
