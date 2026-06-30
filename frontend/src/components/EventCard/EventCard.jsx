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

function formatTime(timeString) {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return minutes !== undefined ? `${hours}:${minutes}` : hours;
}

export default function EventCard({ event, favouriteArtists = [], setFavouriteArtists = () => { }, savedEvents = [], onSavedToggled }) {
    const navigate = useNavigate();
    const { data: session, isPending } = authClient.useSession();

    if (!event) return null;

    // check if this event's artist is already followed
    const isFollowing = favouriteArtists.includes(event.artist);
    const isSaved = savedEvents.some(
        (saved) =>
            (typeof saved === "object" ? saved.eventId : saved) === event._id
    );

    function handleCardClick() {
        navigate(`/events/${event._id}`);
    }

    async function handleSaveToFavourites(e) {
        e.stopPropagation(); // Handles the click on the button without triggering other click handlers
        if (!session && !isPending) {
            navigate("/login");
            return;
        }
        await toggleSavedEvent(event._id);
        if (onSavedToggled) onSavedToggled(event._id);
    }

    function pickEventCardImage(images) {
        const targetRatio = 16 / 9;
        const minWidth = 640; // covers most card sizes at 2x density

        const sixteenNine = images
            .filter(img => Math.abs(img.width / img.height - targetRatio) < 0.05)
            .sort((a, b) => a.width - b.width);

        return (
            sixteenNine.find(img => img.width >= minWidth)
            ?? sixteenNine.at(-1)
            ?? images.sort((a, b) => b.width - a.width)[0]
        );
    }

    let sizes = pickEventCardImage(event.images)

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
                    src={sizes.url}
                    alt={`${event.name} image`}
                    className="event-image"
                />
            )}

            <div className="event_body">
                <h2 className="event_title">{event.name}</h2>
                <p className="event_artist">{event.artist}</p>
                {(event.tags || []).map((tag, index) => (
                    <p key={index}>{tag}</p>
                ))}
                <p className="event_datetime">
                    {formatDate(event.date)}
                    {/* {event.time && `· ${event.time}`} */}
                    {event.time && ` ${formatTime(event.time)}`}
                </p>
                <p className="event_location">
                    {event.venue?.name ? `${event.venue.name}, ` : ""}
                    {event.city}

                </p>

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
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (!session) {
                                navigate("/login");
                            } else {
                                // toggleFavouriteArtists(event.artist);
                                const newFavouriteArtists = await toggleFavouriteArtists(event.artist)
                                // setFavouriteArtists(newFavouriteArtists)
                                if (setFavouriteArtists) setFavouriteArtists(newFavouriteArtists)

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