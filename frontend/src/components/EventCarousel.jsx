 import EventCard from "./EventCard/EventCard";
import "./EventCarousel.css";
import { useRef, useEffect } from "react";
 
export default function EventCarousel({
  title,
  events,
  favouriteArtists,
  setFavouriteArtists,
  savedEvents,
  onSavedToggled,
}) {
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);
 
  useEffect(() => {
    if (!events || events.length === 0) return;
 

    const timeoutId = setTimeout(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
 
      const tick = () => {
        const el = scrollRef.current;
        if (!el) return;
 
        const cardEl = el.querySelector(".event-carousel-card");
        const cardWidth = cardEl ? cardEl.offsetWidth + 32 : 312; 
 
        const maxScroll = el.scrollWidth - el.clientWidth;
 
        if (maxScroll <= 0) return; 
 
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: cardWidth, behavior: "smooth" });
        }
      };
 
      intervalRef.current = setInterval(tick, 3000);
    }, 300); 
 
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalRef.current);
    };
  }, [events]);
 
  const pause = () => clearInterval(intervalRef.current);
 
  const resume = () => {
    clearInterval(intervalRef.current);
    const el = scrollRef.current;
    if (!el) return;
 
    intervalRef.current = setInterval(() => {
      const cardEl = el.querySelector(".event-carousel-card");
      const cardWidth = cardEl ? cardEl.offsetWidth + 32 : 312;
      const maxScroll = el.scrollWidth - el.clientWidth;
 
      if (maxScroll <= 0) return;
 
      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3000);
  };
 
  if (!events || events.length === 0) return null;
 
  return (
    <section className="event-carousel-section">
      {title && <h2>{title}</h2>}
 
      <div
        className="event-carousel"
        ref={scrollRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {events.map((event) => (
          <div className="event-carousel-card" key={event._id}>
            <EventCard
              event={event}
              favouriteArtists={favouriteArtists}
              setFavouriteArtists={setFavouriteArtists}
              savedEvents={savedEvents}
              onSavedToggled={onSavedToggled}
            />
          </div>
        ))}
      </div>
    </section>
  );
}