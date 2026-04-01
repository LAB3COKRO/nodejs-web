require("dotenv").config();
const path = require("path");
const express = require("express");
const { getItems, TABLE } = require("./services/dynamodbItems");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
  try {
    const items = await getItems();
    res.render("index", {
      title: "Beranda",
      items,
      tableName: TABLE,
    });
  } catch (e) {
    res.status(500).render("index", {
      title: "Beranda",
      items: [],
      tableName: TABLE,
      error: e.message || "Gagal memuat data",
    });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await getItems();
    res.json({ ok: true, table: TABLE, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}  (DynamoDB table: ${TABLE})`);
});
