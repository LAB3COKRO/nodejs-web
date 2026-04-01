const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.DYNAMODB_TABLE || "homepage-items";
const REGION = process.env.AWS_REGION || "ap-southeast-1";
const STRICT_DYNAMODB = process.env.STRICT_DYNAMODB === "true";

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
 * @returns {{ message: string, code?: string, statusCode?: number }}
 */
function formatDynamoError(err) {
  return {
    message: [err?.name, err?.message].filter(Boolean).join(": ") || "Unknown DynamoDB error",
    code: err?.code || err?.name,
    statusCode: err?.$metadata?.httpStatusCode,
  };
}

/**
 * @returns {Promise<{ items: Array<{ id: string, nama: string, keterangan: string }>, source: "dynamodb" | "sample", warning?: string }>}
 */
async function getItemsWithMeta() {
  try {
    const items = await listItemsFromDynamoDB();
    if (items.length > 0) return { items, source: "dynamodb" };
    return { items: SAMPLE_ITEMS, source: "sample", warning: "DynamoDB kosong, memakai data contoh." };
  } catch (err) {
    const detail = formatDynamoError(err);
    if (STRICT_DYNAMODB) throw new Error(`[DynamoDB] ${detail.message}`);
    console.warn("[DynamoDB] gagal akses tabel, memakai data contoh:", detail);
    return { items: SAMPLE_ITEMS, source: "sample", warning: detail.message };
  }
}

/**
 * Backward compatible helper
 * @returns {Promise<Array<{ id: string, nama: string, keterangan: string }>>}
 */
async function getItems() {
  const result = await getItemsWithMeta();
  return result.items;
}

module.exports = { getItems, getItemsWithMeta, SAMPLE_ITEMS, TABLE };
