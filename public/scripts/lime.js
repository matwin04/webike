async function sendver() {
    const phone = document.getElementById("phone").value;
    try {
        const res = await fetch(`api/bikes/${phone}`, {})
    }
}