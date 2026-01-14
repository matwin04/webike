
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";
import * as bikes from "./bikes.js";
import sources from "./sources.js";
import { readFile } from "node:fs/promises";
import * as fs from "node:fs";

dotenv.config();

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWS_DIR = path.join(__dirname, "views");
const PARTIALS_DIR = path.join(VIEWS_DIR, "partials");

app.engine("html", engine({ extname: ".html", defaultLayout: false, partialsDir: PARTIALS_DIR }));
app.set("view engine", "html");
app.set("views", VIEWS_DIR);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
    res.render("index");
});
app.get("/bikes/:sourceId", async (req, res) => {
    const data = await bikes.getFreeBikeStatus(req.params.sourceId);
    const stations = data?.data?.bikes || [];
    console.log(stations); // Now logs array of bikes
    res.render("stations", { stations });
});
app.get("/api/bikes/:sourceId", async (req, res) => {
    const sourceId =  req.params.sourceId;
    const data = await bikes.getFreeBikeStatus(sourceId);
    res.json(data); // just return the array
});
app.get("/api/bikes/:sourceId.geojson", async (req, res) => {
    try {
        const geojson = await bikes.getFreeBikeStatus(req.params.sourceId);
        res.setHeader("Content-Type", "application/geo+json");
        res.json(geojson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
app.get("/api/sources", (req, res) => {
    const filePath = path.join(__dirname, "public", "sources.json");
    const json = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(json));
});

app.get("/api/birds", async (req, res) => {
    const data = await bikes.getBird();
    res.json(data.data.bikes); // just return the array
});
app.get("/about", (req, res) => {
    res.render("about");
});
// START SERVER
if (!process.env.VERCEL && !process.env.NOW_REGION) {
    const PORT = process.env.PORT || 8088;
    app.listen(PORT, () => {
        console.log(`Server running: http://localhost:${PORT}`);
        console.log(`📘 Auto-generated API docs will appear at /api-docs`);
        console.log("Welocme to we-bike");
    });
}

export default app;