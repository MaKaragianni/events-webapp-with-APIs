const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const getEvents = async (filters = {}) => {
    try {
        //remove any empty filters before sending
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v)
        )
        const params = new URLSearchParams(cleanFilters)

        const response = await fetch(`${BACKEND_URL}/events?${params}`, {
            credentials: "include"
        })
        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.error || `Failed to fetch events (${response.status})`)
        }
        return response.json()
    } catch (err) {
        console.error("getEvents error:", err)
        throw err
    }
}

// checked with Maria - controller event matches + route
export const getEventById = async (id) => {
    try {
        const response = await fetch(`${BACKEND_URL}/events/${id}`, {
            credentials: "include"
        })

        if (!response.ok) {
            throw new Error("Failed to fetch event")
        }

        return response.json()

    } catch (err) {
        console.error("getSingleEvent error:", err)
        throw err
    }
}

export const getCities = async () => {
    const response = await fetch(`${BACKEND_URL}/events/cities`,{
        credentials: "include",
});
    if (!response.ok) {
        throw new Error("Failed to fetch cities");
    }

    return response.json();
};