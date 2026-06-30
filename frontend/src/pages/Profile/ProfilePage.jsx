import { useEffect, useState } from "react";
import { getMyProfile, updateHomeLocation, getMyBookings } from "../../services/userProfile";
import { authClient } from "../../services/authentication";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import LocationSearch from "../../components/LocationSearch";

function formatDate(dateStr) {
    if (!dateStr) return "TBC";
    return new Date(dateStr).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function ProfilePage() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [homeLocation, setHomeLocation] = useState(null);
    const [success, setSuccess] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [bookings, setBookings] = useState([]);

    const { data: session, isPending } = authClient.useSession()

    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([getMyProfile(), getMyBookings()])
            .then(([profileData, bookingsData]) => {
                setProfile(profileData.profile);
                setHomeLocation(profileData.profile.homeLocation?.city);
                setBookings(bookingsData.bookings || []);
            })
            .catch((error) => setError(error))
            .finally(() => setLoading(false));
    }, []);


    const handleLocationSubmit = async (e) => {
        e.preventDefault()
        if (!selectedLocation) return
        try {
            const updatedCity = await updateHomeLocation({ 
                city: selectedLocation.city, 
                lat: selectedLocation.lat, 
                long: selectedLocation.lng  // ← Geoapify uses lng, backend expects long
            })
            setHomeLocation(updatedCity)
            setSuccess(true)
        } catch (err) {
            setError(err)
        }
    }

    if (error) return <p>{error.message}</p>;

    const upcomingBookings = bookings.filter((b) => !b.isPast);
    const pastBookings = bookings.filter((b) => b.isPast);

    return (
        <div>
            <NavBar />
            <h1>Profile</h1>
            {profile && (
                <div>
                    <form onSubmit={handleLocationSubmit}>
                        <p>Your location: {homeLocation}</p>
                        <LocationSearch onCitySelect={({ city, lat, lng }) => {
                            setSelectedLocation({ city, lat, lng })
                        }} />
                        <button type="submit">Update</button>
                    </form>
                    <p>Your favourite artists: </p>
                    {profile.favouriteArtists.length < 1 ? (
                        <p><i>Follow some artists for personalised recommendations!</i></p>
                    ) : (
                        <ul>
                            {profile.favouriteArtists.map((artist) => (
                                <li key={artist}>{artist}</li>
                            ))}
                        </ul>
                    )}
 
                    <section aria-label="Upcoming bookings">
                        <h2>Upcoming Bookings</h2>
                        {loading ? (
                            <p>Loading bookings...</p>
                        ) : upcomingBookings.length === 0 ? (
                            <p><i>No upcoming bookings.</i></p>
                        ) : (
                            <ul>
                                {upcomingBookings.map((booking) => (
                                    <li key={booking._id}>
                                        <strong>{booking.artist}</strong>
                                        <br />
                                        {booking.name}
                                        <br />
                                        {booking.venue?.name || booking.venue} &mdash; {formatDate(booking.date)}{booking.time ? ` at ${booking.time}` : ""}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
 
                    <section aria-label="Past bookings">
                        <h2>Past Bookings</h2>
                        {loading ? (
                            <p>Loading bookings...</p>
                        ) : pastBookings.length === 0 ? (
                            <p><i>No past bookings.</i></p>
                        ) : (
                            <ul>
                                {pastBookings.map((booking) => (
                                    <li key={booking._id}>
                                        <strong>{booking.artist}</strong>
                                        <br />
                                        {booking.name}
                                        <br />
                                        {booking.venue?.name || booking.venue} &mdash; {formatDate(booking.date)}{booking.time ? ` at ${booking.time}` : ""}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
 
                    <p>Your name: {session.user.name}</p>
                </div>
            )}
        <Footer/>
        </div>
    );
}
