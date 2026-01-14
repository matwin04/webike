import { readFile } from "node:fs/promises";

async function loadSourcesList() {
    const file = await readFile(new URL("./public/sources.json", import.meta.url), "utf-8");
    return JSON.parse(file); // <-- returns { veo: {...}, bird: {...} }
}

function pickFeeds(discovery) {
    const data = discovery?.data;
    if (!data) return null;
    if (data.en?.feeds) return data.en.feeds;
    const firstLang = Object.keys(data)[0];
    return data[firstLang]?.feeds || null;
}

export async function getFreeBikeStatus(sourceId) {
    const sources = await loadSourcesList();
    console.log(sources);
    const source = sources[sourceId];   // ✅ matches your structure

    if (!source) {
        throw new Error("Unknown GBFS source: " + sourceId);
    }

    const discoveryUrl = source.base || source.baseUrl;
    console.log(discoveryUrl);
    if (!discoveryUrl) {
        throw new Error("No base/baseUrl for source: " + sourceId);
    }

    // 1) Fetch GBFS autodiscovery
    const discoveryRes = await fetch(discoveryUrl);
    if (!discoveryRes.ok) {
        throw new Error(`Discovery fetch failed (${discoveryRes.status}) for ${discoveryUrl}`);
    }

    const discovery = await discoveryRes.json();

    const feeds = pickFeeds(discovery);
    if (!Array.isArray(feeds)) {
        throw new Error("Invalid GBFS discovery document for " + sourceId);
    }

    const freeBikeFeed = feeds.find(f => f?.name === "free_bike_status");
    if (!freeBikeFeed?.url) {
        throw new Error("No free_bike_status feed found for " + sourceId);
    }

    // 3) Fetch free_bike_status
    const bikesRes = await fetch(freeBikeFeed.url);
    if (!bikesRes.ok) {
        throw new Error(`free_bike_status fetch failed (${bikesRes.status})`);
    }

    const bikesData = await bikesRes.json();
    const bikes = bikesData?.data?.bikes || [];

    // 4) Convert to GeoJSON
    const features = bikes
        .filter(b => (b.lat ?? b.latitude) != null && (b.lon ?? b.lng ?? b.longitude) != null)
        .map(b => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    Number(b.lon ?? b.lng ?? b.longitude),
                    Number(b.lat ?? b.latitude)
                ]
            },
            properties: {
                bike_id: b.bike_id ?? b.id ?? null,
                reserved: b.is_reserved ?? b.reserved ?? false,
                disabled: b.is_disabled ?? b.disabled ?? false,
                range: b.current_range_meters ?? null,
                source: sourceId
            }
        }));

    return {
        type: "FeatureCollection",
        features
    };
}