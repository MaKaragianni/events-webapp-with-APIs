import { useEffect, useState } from "react";
import { getMyProfile, getMyBookings, updateHomeLocation, getSavedEvents } from "../../services/userProfile";
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

function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    return minutes !== undefined ? `${hours}:${minutes}` : hours;
}

// Compact card used for both saved events and bookings on the profile page
function EventSnapshotCard({ item, onClick }) {
    return (
        <li
            className="event-card event-snapshot-card"
            data-testid="event-snapshot-card"
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
            style={{ 
                cursor: onClick ? "pointer" : "default",
                listStyleType: "none"
            }}
        >
            {item.image?.url && (
                <img
                    src={item.image.url}
                    alt={`${item.name} event image`}
                    className="event-image"
                    data-testid="event-snapshot-image"
                />
            )}
            <div className="event_body">
                <h2 className="event_title">{item.name}</h2>
                <p className="event_artist">{item.artist}</p>
                <p className="event_datetime">
                    {formatDate(item.date)}
                    {item.time && ` ${formatTime(item.time)}`}
                </p>
                <p className="event_location">
                    {(item.venue?.name || item.venue) ? `${item.venue?.name || item.venue}, ` : ""}
                    {item.city}
                </p>
            </div>
        </li>
    );
}

export function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [homeLocation, setHomeLocation] = useState(null);
    const [success, setSuccess] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [bookings, setBookings] = useState([]);
    const [savedEvents, setSavedEvents] = useState([]);

    const { data: session } = authClient.useSession();
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([getMyProfile(), getMyBookings(), getSavedEvents()])
            .then(([profileData, bookingsData, savedData]) => {
                setProfile(profileData.profile);
                setHomeLocation(profileData.profile.homeLocation?.city);
                setBookings(bookingsData.bookings || []);
                setSavedEvents(savedData.savedEvents || []);
            })
            .catch((err) => setError(err))
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
    if (loading) return <p>Loading profile…</p>;

    const upcomingBookings = bookings.filter((b) => !b.isPast);
    const pastBookings = bookings.filter((b) => b.isPast);
    const upcomingSaved = savedEvents.filter((e) => !e.isPast);
    const pastSaved = savedEvents.filter((e) => e.isPast);

    // Card-styling
    const listFlexStyle = {
        display: "flex",
        flexWrap: "wrap",
        gap: "1.5rem",
        padding: 0,
        margin: "1rem 0"
    };

    return (
        <div>
            <NavBar />

            {/* Header section with user's name aligned next to profile context */}
            <header style={{ borderBottom: "1px solid #eee", paddingBottom: "1rem", marginBottom: "2rem" }}>
                <h1 style={{ marginBottom: "0.2rem" }}>Profile</h1>
                {session?.user?.name && (
                    <p style={{ fontSize: "1.2rem", color: "#070707", margin: 0 }}>
                        Welcome back, <strong>{session.user.name}</strong>!
                    </p>
                )}
            </header>

            {profile && (
                <div>
                    <form onSubmit={handleLocationSubmit}>
                        <p><strong>Your location:</strong> {homeLocation}</p>
                        <LocationSearch onCitySelect={({ city, lat, lng }) => {
                            setSelectedLocation({ city, lat, lng })
                        }} />
                        <button type="submit">Update</button>
                    </form>
                    <p><strong>Your favourite artists:</strong> </p>
                    {profile.favouriteArtists.length < 1 ? (
                        <p><i>Follow some artists for personalised recommendations!</i></p>
                    ) : (
                        <ul>
                            {profile.favouriteArtists.map((artist) => (
                                <li key={artist}>{artist}</li>
                            ))}
                        </ul>
                    )}

                    <section aria-label="Upcoming saved events">
                        <h2>Saved Events</h2>
                        {upcomingSaved.length === 0 ? (
                            <p><i>No upcoming saved events.</i></p>
                        ) : (
                            <ul className="event-feed event-snapshot-list" data-testid="saved-events-list">
                                {upcomingSaved.map((event) => (
                                    <EventSnapshotCard
                                        key={event.eventId}
                                        item={event}
                                        onClick={() => navigate(`/events/${event.eventId}`)}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-label="Past saved events">
                        <h2>Past Saved Events</h2>
                        {pastSaved.length === 0 ? (
                            <p><i>No past saved events.</i></p>
                        ) : (
                            <ul className="event-feed event-snapshot-list" data-testid="past-saved-events-list">
                                {pastSaved.map((event) => (
                                    <EventSnapshotCard
                                        key={event.eventId}
                                        item={event}
                                        onClick={() => navigate(`/events/${event.eventId}`)}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-label="Upcoming bookings">
                        <h2>Upcoming Bookings</h2>
                        {upcomingBookings.length === 0 ? (
                            <p><i>No upcoming bookings.</i></p>
                        ) : (
                            <ul className="event-feed event-snapshot-list" data-testid="bookings-list">
                                {upcomingBookings.map((booking) => (
                                    <EventSnapshotCard
                                        key={booking._id}
                                        item={booking}
                                        onClick={booking.ticketUrl ? () => window.open(booking.ticketUrl, "_blank") : undefined}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-label="Past bookings">
                        <h2>Past Bookings</h2>
                        {pastBookings.length === 0 ? (
                            <p><i>No past bookings.</i></p>
                        ) : (
                            <ul className="event-feed event-snapshot-list" data-testid="past-bookings-list">
                                {pastBookings.map((booking) => (
                                    <EventSnapshotCard
                                        key={booking._id}
                                        item={booking}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}
            <Footer />
        </div>
    );
}