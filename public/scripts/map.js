const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    center: [-118.25, 34.05],
    zoom: 12
});

async function loadBikeMarkers() {
    // Fetch from your own API endpoint
    const response = await fetch("/api/bikes");
    const bikes = await response.json(); // array of bike objects

    const geojson = {
        type: "FeatureCollection",
        features: bikes.map(bike => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [bike.lon, bike.lat]
            },
            properties: {
                bike_id: bike.bike_id,
                disabled: bike.is_disabled,
                reserved: bike.is_reserved
            }
        }))
    };

    map.addSource("bikes", { type: "geojson", data: geojson });

    map.addLayer({
        id: "bikes-layer",
        type: "circle",
        source: "bikes",
        paint: {
            "circle-radius": 6,
            "circle-color": "#008cff",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2
        }
    });

    map.on("click", "bikes-layer", (e) => {
        const props = e.features[0].properties;
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Bike ID:</strong> ${props.bike_id}<br>
                <strong>Reserved:</strong> ${props.reserved}<br>
                <strong>Disabled:</strong> ${props.disabled}
            `)
            .addTo(map);
    });

    map.on("mouseenter", "bikes-layer", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "bikes-layer", () => {
        map.getCanvas().style.cursor = "";
    });
}

map.on("load", loadBikeMarkers);