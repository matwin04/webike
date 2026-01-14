const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05],
    zoom: 12
});
map.addControl(new maplibregl.NavigationControl());

async function loadSourcesList() {
    const res = await fetch("/api/sources");
    if (!res.ok) throw new Error(`Failed to load /api/sources (${res.status})`);
    const sources = await res.json();
    return sources?.sources || sources;
}

function addBikeSourceAndLayer(source) {
    const sourceId = source.id;               // "veo", "bird", etc.
    const mapSourceId = `bikes-${sourceId}`;  // MapLibre source name
    const layerId = `bikes-layer-${sourceId}`;

    if (!sourceId) return;

    if (map.getSource(mapSourceId) || map.getLayer(layerId)) return;

    map.addSource(mapSourceId, {
        type: "geojson",
        data: `/api/bikes/${sourceId}`
    });

    map.addLayer({
        id: layerId,
        type: "circle",
        source: mapSourceId,
        paint: {
            "circle-radius": 5,
            "circle-color": source.color,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2
        }
    });

    map.on("click", layerId, (e) => {
        const props = e.features?.[0]?.properties || {};
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
        <strong>Source:</strong> ${props.source ?? sourceId}<br>
        <strong>Bike ID:</strong> ${props.bike_id ?? ""}<br>
        <strong>Reserved:</strong> ${props.reserved ?? ""}<br>
        <strong>Disabled:</strong> ${props.disabled ?? ""}<br>
        <strong>Range:</strong> ${props.range ?? ""}<br></br>
      `)
            .addTo(map);
    });

    map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));
}

map.on("load", async () => {
    const sources = await loadSourcesList();
    console.log("Loaded sources:", sources);

    // ✅ Works for your object-shaped sources.json
    const list = Array.isArray(sources) ? sources : Object.values(sources);

    for (const source of list) {
        addBikeSourceAndLayer(source);
    }
});