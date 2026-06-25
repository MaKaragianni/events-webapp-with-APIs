import { useNavigate } from "react-router-dom";
import { toggleFavouriteArtists } from "../../services/userProfile";

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function EventCard({ event, favouriteArtists = [] }) {
    const navigate = useNavigate();

    if (!event) return null;
    
    // check if this event's artist is already followed
    const isFollowing = favouriteArtists.includes(event.artist)

    function handleClick() {
        navigate(`/events/${event._id}`);
    }

    return (
        <div
            className ="event-card"
            onClick={handleClick}
            // Allow users to interact
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            data-testid="event-card"
        >
            {event.imageUrl && (
                <img
                    src={event.imageUrl}
                    alt={`${event.name} image`}
                    className="event-image"
            />
            )}

            <div className="event_body">
                <h2 className="event_title">{event.name}</h2>
                <p className="event_artist">{event.artist}</p>
                <p className="event_genre">{event.genre}</p>
                <p className="event_datetime">
                    {formatDate(event.date)}
                    {event.time && `· ${event.time}`}
                </p>
                <p className="event_location">
                    {event.venue ? `${event.venue}, ` : ""}
                    {event.city}
                </p>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleFavouriteArtists(event.artist)
                    }}
                >
                    {isFollowing ? "Following" : "Follow"}
                </button>

            {/* {event.ticketUrl && (
            <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
            >
                Buy Tickets
            </a> */}
        </div>
    </div>    
);
}