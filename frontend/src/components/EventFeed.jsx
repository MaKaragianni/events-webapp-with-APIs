import EventCard from "./EventCard/EventCard";

const EventFeed = ({ events, favouriteArtists, savedEvents, isLoggedIn }) => {
    if (events.length === 0) {
        return <p>No events found</p>;
    }

    return (
        <div className="event-feed">
            {events.map((event) => (
                <EventCard
                    key={event._id}
                    event={event}
                    favouriteArtists={favouriteArtists}
                    savedEvents={savedEvents}
                    isLoggedIn={isLoggedIn}
                />
            ))}
        </div>
    );
};

export default EventFeed;