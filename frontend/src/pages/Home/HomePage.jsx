import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./HomePage.css";
import Hero from "../../components/Hero";
import SignUpBanner from "../../components/SignUpBanner";
import Footer from "../../components/Footer";
import NavBar from "../../components/NavBar";
import EventCarousel from "../../components/EventCarousel";
import { getEvents } from "../../services/events";
import { getMyProfile } from "../../services/userProfile";
import { authClient } from "../../services/authentication";

export function HomePage() {
  const [homeEvents, setHomeEvents] = useState([]);
  const [ukEvents, setUkEvents] = useState([]);
  const { data: session, isPending } = authClient.useSession();
  const getStartedLink = session?.user ? "/feed" : "/login";

  const fallbackCities = ["London", "Manchester", "Bristol", "Liverpool", "Glasgow"];

  useEffect(() => {
    if (!isPending && session?.user) {
      getMyProfile()
        .then(({ profile }) => {
          const city = profile.homeLocation?.city;
          if (city) {
            return getEvents({ city }).then((data) => {
              const today = new Date();
              const upcomingEvents = (data.events || []).filter((event) => {
                return new Date(event.date) >= today;
              });
              setHomeEvents(upcomingEvents);
              });
          }
        })
        .catch((err) => console.error("Profile/home events failed:", err));
    }
  }, [session, isPending]);

  useEffect(() => {
    Promise.all(fallbackCities.map((city) => getEvents({ city })))
      .then((results) => {
        const events = results.flatMap((result) => result.events || []);
        setUkEvents(events);
      })
      .catch((err) => console.error("UK events failed:", err));
  }, []);

  const carouselEvents = homeEvents.length > 0 ? homeEvents : ukEvents;

  return (
    <div>
      <NavBar />
      <Hero
        left={
          <>
            <p className="hero-subtitle">LIVE MUSIC, SORTED</p>
            <h1>
              FIND YOUR <span>NEXT</span>
              <br />
              SHOW BEFORE IT
              <br />
              SELLS OUT
            </h1>
            <p className="hero-description">
              EnCore tracks the artists you love and surfaces every gig worth knowing about.
            </p>
              <div className="hero-buttons">
              <Link
                to={getStartedLink}
                className="hero-btn-primary"
              >
                Get started
              </Link>

              <Link
                to="/feed"
                className="hero-btn-secondary"
              >
                Browse events
              </Link>
            </div>
              </>
            }
        right={
          <div className="hero-artwork-placeholder">
            <div className="hero-artwork-card large"></div>
            <div className="hero-artwork-card small"></div>
          </div>
        }
      />
      <EventCarousel
        title="Trending Now"
        events={carouselEvents}
      />
      <SignUpBanner />
      <Footer />
    </div>
  );
}
