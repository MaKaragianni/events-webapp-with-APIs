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
        throw err
    }
}