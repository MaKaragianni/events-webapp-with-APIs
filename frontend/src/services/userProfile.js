const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function getMyProfile() {
    try {
        const requestOptions = {
            method: "GET",
            credentials: "include"
        }
        const response = await fetch(`${BACKEND_URL}/profile/me`, requestOptions)
        if (response.status !== 200) {
            throw new Error("Unable to fetch user's profile");
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err)
    }
}

export async function toggleFavouriteArtists() {
    try {
        const requestOptions = {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ artist })
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/favourite-artists`, requestOptions)
        if (response.status !== 200) {
            throw new Error("Unable to toggle favourite artist");
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err)
    }
}