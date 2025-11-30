export async function getAllStations() {
    try {
        const response = await fetch(
            "https://cluster-prod.veoride.com/api/shares/name/xla/gbfs/free_bike_status"
        )
        return await response.json();
    } catch (error) {
        console.error("Error fetching station data:", error);
    }
}
