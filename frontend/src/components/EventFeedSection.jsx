import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { getEvents, getCities } from "../services/events"
import EventFeed from "./EventFeed"
import EventFilters from "./EventFilters"
import { useNavigate } from "react-router-dom"
import { MapPinned } from "lucide-react"
import { format } from "date-fns"
function EventFeedSection({ profile, isLoggedIn }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [eventsError, setEventsError] = useState()
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const city = searchParams.get("city") || profile?.homeLocation?.city || "Manchester"
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const tag = searchParams.get("tag") || ""


  function updateParam(updates) {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) nextParams.set(key, value)
        else nextParams.delete(key)
      })
      return nextParams
    })
  }

  useEffect(() => {
    getCities()
      .then((data) => setCities(data.cities))
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    getEvents({ city, from: format(new Date(), "yyyy-MM-dd"), to })
      .then((data) => setEvents(data.events))
      .catch((err) => setEventsError(err))
      .finally(() => setLoading(false))
  }, [city])

  const topTags = useMemo(() => {
    const counts = {}
    events.forEach((event) => {
      event.tags?.forEach((tagName) => {
        counts[tagName] = (counts[tagName] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tagName]) => tagName)
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      if (tag && !event.tags?.includes(tag)) return false
      if (from && eventDate < new Date(`${from}T00:00:00`)) return false
      if (to && eventDate > new Date(`${to}T23:59:59`)) return false
      return true
    })
  }, [events, tag, from, to])

  if (loading) return <p>Loading events...</p>

  return (
    <div className="centre">
      <EventFilters
        city={city}
        from={from}
        to={to}
        tag={tag}
        cities={cities}
        topTags={topTags}
        onChange={updateParam}
      />
      <div className="flex flex-row gap-5 items-center">

        <div className="flex flex-row gap-2 items-center py-3">
          <p className="text-primary font-semibold text-5xl py-2">{`Popular Events`}</p>
          <p className="text-secondary font-semibold text-5xl py-2">{`in ${city}`}</p>
        </div>
        <MapPinned className="text-secondary translate-y-0.5" size={36} onClick={(() => (navigate("/explore")))} />
      </div>
      <EventFeed
        events={filteredEvents}
        favouriteArtists={profile?.favouriteArtists || []}
        savedEvents={profile?.savedEvents || []}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}

export default EventFeedSection