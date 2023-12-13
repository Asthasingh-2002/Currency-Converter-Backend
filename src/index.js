const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const bodyParser = require('body-parser');
const cron = require("node-cron");
const{ServerConfig,DbConnect} = require('./config') 

const app = express();


app.use(bodyParser.json());

DbConnect();
const cryptoSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  symbol: String,
  time: {type:Date,
    default:Date.now
  }
});

const Crypto = mongoose.model("Crypto", cryptoSchema);

const updateCryptoList = async () => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/list"
    );
    const cryptoList = response.data;
    await Crypto.deleteMany({});

     await Crypto.insertMany(cryptoList);
  } catch (error) {
    console.error("Error updating crypto list:", error.message);
  }
};

// Run the updateCryptoList function every 1 hour
cron.schedule("0 * * * *", updateCryptoList);



// app.get("/getCryptoList", (req, res) => {
//   try {
//     updateCryptoList();
//     res.send("Update job scheduled!");
//   } catch (error) {
//     res.status(500).send("Internal server Error")
//   }

// });



app.post('/getHistoricalPrice', async (req, res) => {
  const { fromCurrency, toCurrency, date } = req.body;

  try {
                            
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${fromCurrency}/market_chart`, {
      params: { vs_currency: toCurrency, days: 1 , interval: 'daily', date},
    });
   

    const historicalData = response.data;
    if (historicalData.prices && historicalData.prices.length > 0) {
      const price = historicalData.prices[0][1];
      res.json({ price });
    } else {
      res.status(404).json({ error: 'Data not available for the specified date' });
    }
   
  } catch (error) {
    console.error('Error fetching historical price:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(ServerConfig.PORT, () => {
  console.log(`Server is running on http://localhost:${ServerConfig.PORT}`);
});



