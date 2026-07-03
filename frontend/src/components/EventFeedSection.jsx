import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { getEvents, getCities } from "../services/events"
import EventFeed from "./EventFeed"
import EventFilters from "./EventFilters"
import { useNavigate } from "react-router-dom"
import { MapPinned } from "lucide-react"
import { format } from "date-fns"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"


function EventFeedSection({ profile, isLoggedIn }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [eventsError, setEventsError] = useState()
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [topTags, setTopTags] = useState([])
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  const city = searchParams.get("city") || profile?.homeLocation?.city || ""
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const tag = searchParams.get("tag") || ""
  const LIMIT = 10
  const offset = (currentPageNum - 1) * LIMIT
  const navigate = useNavigate()

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
    getEvents({ city, from: from || format(new Date(), "yyyy-MM-dd"), to, limit: LIMIT, offset, tag })
      .then((data) => {
        setEvents(data.events)
        setTotalEvents(data.totalEvents)
        setTopTags(data.topTags)
      })
      .catch((err) => setEventsError(err))
      .finally(() => setLoading(false))
  }, [city, from, to, offset, tag])

  // resets the current page when any of the filters change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [city, tag, from, to]);

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
      <div className="flex flex-row gap-5 items-center">
        <div className="flex flex-row gap-2 items-center py-3">
          <p className="text-primary font-semibold text-5xl py-2">{`Popular Events`}</p>
          <p className="text-secondary font-semibold text-5xl py-2">{`in ${city || "Great Britain"}`}</p>
        </div>
        <MapPinned className="text-secondary translate-y-0.5" size={36} onClick={(() => (navigate("/explore")))} />
      </div>
      <EventFeed
        events={events}
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