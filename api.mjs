import axios from "axios";
import "dotenv/config";

const urlCliente = process.env.CLIENTS_URL;
const urlBids = process.env.BIDS_URL;

export const getBidWinner = async (productId, token) => {
  console.log("getBidWinner", productId);
  const response = await axios.get(`${urlBids}/?productId=${productId}`, {
    headers: {
      Authorization: token,
    },
  });
  const pujas = response.data;
  console.log(pujas);
  let winner = null;
  if (pujas && pujas.length > 0) {
    winner = pujas.reduce(
      (max, p) => (p.amount > max.amount ? p : max),
      pujas[0]
    );
  }
  return winner?.userId;
};

export const getClientById = async (id) => {
  const response = await axios.get(`${urlCliente}/v1/${id}`, {
    headers: {
      Authorization: process.env.GOOGLE_CLIENT_ID,
    },
  });
  return response.data;
};

export const getBidsByProductId = async (id) => {
  const response = await axios.get(`${urlBids}/v1/?productId=${id}`);
  return response.data;
};
