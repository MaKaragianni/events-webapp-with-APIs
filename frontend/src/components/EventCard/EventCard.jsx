import { useNavigate } from "react-router-dom";
import { toggleFavouriteArtists, toggleSavedEvent } from "../../services/userProfile";
import { authClient } from "../../services/authentication";

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function formatTime(timeString) {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return minutes !== undefined ? `${hours}:${minutes}` : hours;
}

export default function EventCard({ event, favouriteArtists, savedEvents, isLoggedIn }) {
    const navigate = useNavigate();
    // const { data: session, isPending } = authClient.useSession();
    if (!event) return null;

    // check if this event's artist is already followed
    const isFollowing = favouriteArtists.includes(event.artist);
    const isSaved = savedEvents.includes(event._id);

    function handleCardClick() {
        navigate(`/events/${event._id}`);
    }

    async function handleSaveToFavourites(e) {
        e.stopPropagation(); // Handles the click on the button without triggering other click handlers
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }
        await toggleSavedEvent(event._id);
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

    let sizes = event.images && event.images.length > 0 
    ? pickEventCardImage(event.images) 
    : null;

    return (
        <div
            className="event-card"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
            data-testid="event-card"
        >
            <div className="card-image-wrap">
                {sizes && sizes.url && (
                    <img
                        src={sizes.url}
                        alt={`${event.name} image`}
                        className="event-image"
                    />
                )}
                <button
                    className="save-event-btn"
                    data-testid="save-event-btn"
                    onClick={handleSaveToFavourites}
                    aria-label={isSaved ? "Remove from saved events" : "Save event"}
                    title={isSaved ? "Remove from saved events" : "Save event"}
                >
                    {isSaved ? "♥" : "♡"}
                </button>

            </div>

            <div className="event_body">
                <p className="event_title">{event.name}</p>
                <p className="event_datetime">
                    {formatDate(event.date)} {formatTime(event.time)}
                </p>
                <p className="event_location">
                    {event.venue?.name ? `${event.venue.name}` : ""}
                </p>
            </div>
        </div>
    );
}