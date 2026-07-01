import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { getEvents, getCities } from "../services/events"
import EventFeed from "./EventFeed"
import EventFilters from "./EventFilters"
import { useNavigate } from "react-router-dom"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"


function EventFeedSection({ profile , isLoggedIn}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [eventsError, setEventsError] = useState()
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const city = searchParams.get("city") || profile?.homeLocation?.city ||"Manchester"
  const from = searchParams.get("from") || ""
  // const from = searchParams.get("from") || new Date()
  const to = searchParams.get("to") || ""
  const tag = searchParams.get("tag") || ""
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  const LIMIT = 10
  const offset = (currentPageNum - 1) * LIMIT

  function updateParam(key, value) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, value)
    else nextParams.delete(key)
    setSearchParams(nextParams)
  }

  useEffect(() => {
    getCities()
      .then((data) => setCities(data.cities))
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    getEvents({ city, from, to, limit: LIMIT, offset, tag })
      .then((data) => {
        console.log(data)
        setEvents(data.events)
        setTotalEvents(data.totalEvents)
      })
      .catch((err) => setEventsError(err))
      .finally(() => setLoading(false))
  }, [city, from, to, offset, tag])


  
  // resets the current page when any of the filters change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [city, tag, from, to]);

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

  const totalPages = Math.ceil(totalEvents / LIMIT);
  const hasNextPage = currentPageNum < totalPages;
  const hasPrevPage = currentPageNum > 1;

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
      <h1 className="events-title">{`Popular events in ${city}`}  <button onClick={(() => (navigate("/explore")))}>explore</button> </h1>

      <EventFeed
        events={filteredEvents}
        favouriteArtists={profile?.favouriteArtists || []}
        savedEvents={profile?.savedEvents || []}
        isLoggedIn={isLoggedIn}
      />
      <Pagination>
        <PaginationContent>
          {hasPrevPage && (
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => {
                  const isFirstPage = currentPageNum <= 1;
                  if (isFirstPage) return;

                  setCurrentPageNum(currentPageNum - 1);
                }} 
              />
            </PaginationItem>
          )}
  
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext 
                onClick={() => {
                  const isLastPage = currentPageNum >= totalPages;
                  console.log(currentPageNum)
                  if (isLastPage) return;

                  setCurrentPageNum(currentPageNum + 1);
                }}
              />
            </PaginationItem>
          )}


        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default EventFeedSection