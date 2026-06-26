import EventCard from "./EventCard/EventCard";

const EventFeed = ({ events, favouriteArtists, setFavouriteArtists, savedEvents = [], onSavedToggled }) => {
    if (events.length === 0) {
        return <p>No events found</p>;
    }

    return (
        <div>
            {events.map((event) => (
                <EventCard
                    key={event._id}
                    event={event}
                    favouriteArtists={favouriteArtists}
                    setFavouriteArtists={setFavouriteArtists}
                    savedEvents={savedEvents}
                    onSavedToggled={onSavedToggled}
                />
            ))}
        </div>
    );
};

export default EventFeed;