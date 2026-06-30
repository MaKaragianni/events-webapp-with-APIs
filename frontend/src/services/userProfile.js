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

export async function toggleFavouriteArtists(artist) {
    try {
        const requestOptions = {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({artist})
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/favourite-artists`, requestOptions)
        if (response.status !== 200) {
            throw new Error("Unable to toggle favourite artist");
        }
        const data = await response.json();
        const newFavouriteArtists = data.profile.favouriteArtists
        return newFavouriteArtists;
    } catch (err) {
        console.error(err)
        throw err
    }
}

export async function toggleSavedEvent(eventId) {
    try {
        const requestOptions = {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId })
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/saved-events`, requestOptions)
        if (response.status !== 200) {
            throw new Error("Unable to toggle saved event");
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err)
        throw err
    }
}


export async function updateHomeLocation({ city, lat, long }) {
    try {
        const requestOptions = {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                homeLocation: { city, lat, long }
            })
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/location`, requestOptions)
        const data = await response.json()
        if (response.status !== 200) {
            throw new Error("Unable to update your home location")
        }
        return data.profile.homeLocation.city
    } catch (err) {
        console.error(err)
        throw err
    }
}
    
/**
 * Records a booking for the given event.
 * Returns the updated profile on success.
 * Throws if the event is already booked (409) or another error occurs.
 */
export async function addBooking(eventId) {
    try {
        const requestOptions = {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId })
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/bookings`, requestOptions)

        if (response.status === 409) {
            throw new Error("already_booked")
        }
        if (response.status !== 201) {
            throw new Error("Unable to add booking");
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err)
        throw err
    }
}

/**
 * Fetches booking details for display on the profile page.
 * Returns { bookings: [{ _id, name, artist, venue, date, time, isPast }] }
 */
export async function getMyBookings() {
    try {
        const requestOptions = {
            method: "GET",
            credentials: "include"
        }
        const response = await fetch(`${BACKEND_URL}/profile/me/bookings`, requestOptions)
        if (response.status !== 200) {
            throw new Error("Unable to fetch bookings");
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err)
        throw err
    }
}