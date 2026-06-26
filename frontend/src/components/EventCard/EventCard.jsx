import { useNavigate } from "react-router-dom";
import { toggleFavouriteArtists, toggleSavedEvent } from "../../services/userProfile";
import { authClient } from "../../services/authentication";

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function EventCard({ event, favouriteArtists = [], setFavouriteArtists, savedEvents = [], onSavedToggled }) {
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();

    if (!event) return null;

    // check if this event's artist is already followed
    const isFollowing = favouriteArtists.includes(event.artist);
    const isSaved = savedEvents.includes(event._id);

    function handleCardClick() {
        navigate(`/events/${event._id}`);
    }

    async function handleSaveToFavourites(e) {
        e.stopPropagation(); // Handles the click on the button without triggering other click handlers
        if (!session) {
            navigate("/login");
            return;
        }
        await toggleSavedEvent(event._id);
        if (onSavedToggled) onSavedToggled(event._id);
    }

    return (
        <div
            className="event-card"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
            data-testid="event-card"
        >
            {event.images && (
                <img
                    style={{height:"200px", width:"auto"}}
                    src={event.images[0].url}
                    alt={`${event.name} image`}
                    className="event-image"
                />
            )}

            <div className="event_body">
                <h2 className="event_title">{event.name}</h2>
                <p className="event_artist">{event.artist}</p>
                {event.tags.map((tag) => (
                    <p>{tag}</p>
                ))}
                <p className="event_datetime">
                    {formatDate(event.date)}
                    {event.time && `· ${event.time}`}
                </p>
                <p className="event_location">
                    {event.venue ? `${event.venue}, ` : ""}
                    {event.city}
                </p>
                <button
                    onClick={async (e) => {
                        e.stopPropagation()
                        if (!session) {
                            navigate("/login")
                        } else {
                            const newFavouriteArtists = await toggleFavouriteArtists(event.artist)
                            setFavouriteArtists(newFavouriteArtists)
                        }
                    }}
                >
                    {isFollowing ? "Following" : "Follow"}
                </button>

                <div className="event_actions">
                    {/* Save event to favourites */}
                    <button
                        className="save-event-btn"
                        data-testid="save-event-btn"
                        onClick={handleSaveToFavourites}
                        aria-label={isSaved ? "Remove from saved events" : "Save event"}
                        title={isSaved ? "Remove from saved events" : "Save event"}
                    >
                        {isSaved ? "♥" : "♡"}
                    </button>

                    {/* Follow artist */}
                    <button
                        className="follow-artist-btn"
                        data-testid="follow-artist-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!session) {
                                navigate("/login");
                            } else {
                                toggleFavouriteArtists(event.artist);
                            }
                        }}
                    >
                        {isFollowing ? "Following" : "Follow"}
                    </button>
                </div>
            </div>
        </div>
    );
}