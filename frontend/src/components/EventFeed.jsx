import EventCard from "./EventCard/EventCard";

const EventFeed = ({ events, favouriteArtists }) => {
    if (events.length === 0) {
        return <p>No events found</p>
    }

    return (
        <div>
            {events.map(event => (
                <EventCard key={event._id} event={event} favouriteArtists={favouriteArtists}/>
            ))}

    </div>
)};

export default EventFeed;