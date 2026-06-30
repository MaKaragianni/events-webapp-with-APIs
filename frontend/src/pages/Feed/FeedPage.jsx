import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "../../services/authentication";
import { getEvents, getCities } from "../../services/events";
import { getMyProfile, getMyBookings } from "../../services/userProfile";
import EventFeed from "../../components/EventFeed";
import NavBar from "../../components/NavBar";
import Recommendations from "../../components/Recommendations";
import HomeLocationUpdateDialog from "../../components/HomeLocationUpdateDialog";

import Footer from "../../components/Footer";


export function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState([]);
  const [eventsError, setEventsError] = useState(null);
  const [favouriteArtists, setFavouriteArtists] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [homeCity, setHomeCity] = useState(null);
  const [isFirstLoginSession, setIsFirstLoginSession] = useState(null);
  const { data: session, isPending } = authClient.useSession();

  const DEFAULT_CITY = "Manchester";
  const city = searchParams.get("city") || DEFAULT_CITY;
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const tag = searchParams.get("tag") || "";

  function updateParam(key, value) {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  }

  useEffect(() => {
    getCities()
      .then((data) => setCities(data.cities))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setEventsError(null);
    getEvents({ city })
      .then((data) => setEvents(data.events))
      .catch((err) => setEventsError(err))
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    if (!isPending && session?.user) {
      getMyProfile()
        .then(({ profile }) => {
          setFavouriteArtists(profile.favouriteArtists || []);
          setSavedEvents(profile.savedEvents || []);
          setBookings(profile.bookings || []);
          setHomeCity(profile.homeLocation?.city || null);
          setIsFirstLoginSession(profile.isFirstLogin || null);
        })
        .catch((err) => console.error("Profile fetch failed:", err));
    }
  }, [session, isPending]);

  useEffect(() => {
    if (session?.user && homeCity && !searchParams.get("city")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("city", homeCity);
      setSearchParams(nextParams);
    }
  }, [homeCity, session, searchParams, setSearchParams]);

  function handleSavedToggled(eventId) {
    if (session && !isPending) {
      setSavedEvents((prev) => {
        // Safe check since savedEvents is an array of objects
        const exists = prev.some((e) => (typeof e === 'object' ? e.eventId === eventId : e === eventId));
        if (exists) {
          return prev.filter((e) => (typeof e === 'object' ? e.eventId !== eventId : e !== eventId));
        } else {
          // Fallback minimal structural object for UI updating until next reload
          return [...prev, { eventId }];
        }
      });
    }
  }

  const topTags = useMemo(() => {
    const counts = {}

    events.forEach((event) => {
      event.tags?.forEach((tagName) => {
        if (!tagName || tagName === "Undefined") return;
        counts[tagName] = (counts[tagName] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tagName]) => tagName);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);

      if (tag && !event.tags?.includes(tag)) return false;
      if (from && eventDate < new Date(`${from}T00:00:00`)) return false;
      if (to && eventDate > new Date(`${to}T23:59:59`)) return false;

      return true;
    });
  }, [events, tag, from, to]);

  if (loading) return <p>Loading events...</p>;
  // if (error) return <p>Something went wrong</p>;

  const handleFirstLoginComplete = async () => {
    const { profile } = await getMyProfile();
    setHomeCity(profile.homeLocation?.city || null);
  }

  return (
    <>
      <NavBar />
      <HomeLocationUpdateDialog
        isFirstLoginSession={isFirstLoginSession}
        setIsFirstLoginSession={setIsFirstLoginSession}
        onCompleted={handleFirstLoginComplete}
      />

      <Recommendations
        favouriteArtists={favouriteArtists}
        setFavouriteArtists={setFavouriteArtists}
        savedEvents={savedEvents}
        bookings={bookings}
        onSavedToggled={handleSavedToggled}
        events={events}
      />

      <h2>Events!</h2>
      {eventsError && <p>Something went wrong loading events.</p>}
      
      <section>
        <label>
          City:
          <select
            value={city}
            onChange={(e) => updateParam("city", e.target.value)}
          >
            {cities.length === 0 && (
              <option value="Manchester">Manchester</option>
            )}
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </label>

        <label>
          From:
          <input
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </label>

        <label>
          To:
          <input
            type="date"
            value={to}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </label>
      </section>

      <section>
        <button onClick={() => updateParam("tag", "")}>
          All events
        </button>
        {topTags.map((tagName) => (
          <button
            key={tagName}
            onClick={() => updateParam("tag", tag === tagName ? "" : tagName)}
          >
            {tagName}
          </button>
        ))}
      </section>



      <EventFeed
        events={filteredEvents}
        favouriteArtists={favouriteArtists}
        setFavouriteArtists={setFavouriteArtists}
        savedEvents={savedEvents}
        onSavedToggled={handleSavedToggled}
      />
      <Footer/>
    </>
  );
}
