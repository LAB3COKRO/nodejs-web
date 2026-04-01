const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.DYNAMODB_TABLE || "homepage-items";
const REGION = process.env.AWS_REGION || "ap-southeast-1";

let docClient = null;

function getDocClient() {
  if (!docClient) {
    const client = new DynamoDBClient({ region: REGION });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

/** Data contoh jika DynamoDB belum tersedia atau kosong */
const SAMPLE_ITEMS = [
  { id: "1", nama: "Selamat datang", keterangan: "Ini data contoh. Ganti dengan isi tabel DynamoDB Anda." },
  { id: "2", nama: "Node.js + DynamoDB", keterangan: "Nama dan keterangan diambil dari tabel saat AWS dikonfigurasi." },
];

/**
 * Normalisasi item DynamoDB ke { id, nama, keterangan }
 */
function normalizeItem(raw, index) {
  const id = raw.id ?? raw.pk ?? raw.sk ?? String(index);
  const nama = raw.nama ?? raw.name ?? raw.title ?? "Tanpa nama";
  const keterangan = raw.keterangan ?? raw.description ?? raw.deskripsi ?? "";
  return { id: String(id), nama, keterangan };
}

async function listItemsFromDynamoDB() {
  const client = getDocClient();
  const out = await client.send(
    new ScanCommand({
      TableName: TABLE,
      Limit: 100,
    })
  );
  const items = (out.Items || []).map((row, i) => normalizeItem(row, i));
  return items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * @returns {Promise<Array<{ id: string, nama: string, keterangan: string }>>}
 */
async function getItems() {
  try {
    const items = await listItemsFromDynamoDB();
    if (items.length > 0) return items;
    return SAMPLE_ITEMS;
  } catch (err) {
    console.warn("[DynamoDB]", err.name || err.message, "- memakai data contoh.");
    return SAMPLE_ITEMS;
  }
}

module.exports = { getItems, SAMPLE_ITEMS, TABLE };
