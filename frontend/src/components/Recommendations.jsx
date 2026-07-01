import EventCard from './EventCard/EventCard'
import { useState, useEffect } from 'react'
import { getEvents } from '@/services/events'

function Recommendations({ profile }) {
console.log('profile:', profile)

    const [events, setEvents] = useState([]);
    const [loading,setLoading] = useState(true)

    useEffect(() => {
        if (!profile?.homeLocation?.city) return null;
        getEvents({
            city: profile?.homeLocation?.city,
            from: new Date(),
            to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })
            .then((data) => setEvents(data.events))
            .catch((err) => console.error(err))
            .finally(()=> setLoading(false))
    }, [profile?.homeLocation?.city])

    if (!profile) return null


    // genres from favourite artists
    const genresFromArtists = [...new Set(
        events
            .filter(event => profile.favouriteArtists.includes(event.artist))
            .map(event => event.tags?.[0])
            .filter(Boolean)
    )]
    // genres from saved events
    // savedEvents is now an array of objects (new schema)
    // Guard against the old plain string IDs so nothing breaks if old data still exists.
    const savedEventObjects = Array.isArray(profile.savedEvents)
        ? profile.savedEvents.filter(e => typeof e === 'object' && e !== null)
        : []

    // Collect tags from saved event snapshots
    const genresFromSaved = [...new Set(
        savedEventObjects.flatMap(e => e.tags || []).filter(Boolean)
    )]
    // Also look up saved events in the feed (catches events saved before the
    // schema migration that may still be represented as IDs)
    const savedIds = new Set([
        ...savedEventObjects.map(e => e.eventId),
        ...profile.savedEvents.filter(e => typeof e === 'string'),
    ])
    const bookingIds = new Set(profile?.bookings)
    const genresFromSavedFeed = [...new Set(
        events
            .filter(event => savedIds.has(event._id))
            .map(event => event.tags?.[0])
            .filter(Boolean)
    )]
    // genres from past purchases (bookings)
    const genresFromBookings = [...new Set(
        events
            .filter(event => bookingIds.has(event._id))
            .map(event => event.tags?.[0])
            .filter(Boolean)
    )]
    // Merge all genre signals
    const allFavouriteGenres = [...new Set([
        ...genresFromArtists,
        ...genresFromSaved,
        ...genresFromSavedFeed,
        ...genresFromBookings,
    ])]
    // Filter events by merged genres, excluding already-saved ones
    const recommendedEvents = allFavouriteGenres.length > 0
        ? events.filter(event =>
            allFavouriteGenres.includes(event.tags?.[0]) &&
            !savedIds.has(event._id) && // don't re-recommend what's already saved
            !bookingIds.has(event._id) // Exclude already-purchased events
        )
        : []

    const hasActivity = profile.favouriteArtists.length > 0 || savedEventObjects.length > 0

    if(loading) return <p>loading...</p>

    return (
        < div className='foryou-banner'>
            {/* <h2>Recommended for you</h2> */}
            {!hasActivity ? (
                <p>Save events or follow artists to see personalised recommendations</p>
            ) : recommendedEvents.length === 0 ? (
                <p>No new recommendations right now — check back after more events are added!</p>
            ) : (
                <div className="foryou">
                    {recommendedEvents.slice(0, 5).map(event => (
                        <EventCard
                            key={event._id}
                            event={event}
                            favouriteArtists={profile.favouriteArtists}
                            savedEvents={profile.savedEvents}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Recommendations

