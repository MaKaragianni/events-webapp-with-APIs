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
import gradientLogo from "../../assets/logo-for-hero-2.svg"

export function HomePage() {
  const [homeEvents, setHomeEvents] = useState([]);
  const [ukEvents, setUkEvents] = useState([]);
  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const fallbackCities = ["London", "Manchester", "Bristol", "Liverpool", "Glasgow"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!isPending && session?.user) {
      getMyProfile()
        .then(({ profile }) => {
          const city = profile.homeLocation?.city;
          if (city) {
            return getEvents({ city, from: today.toISOString() }).then((data) => {
              setHomeEvents(data.events || []);
            });
          }
        })
        .catch((err) => console.error("Profile/home events failed:", err));
    }
  }, [session, isPending]);

  useEffect(() => {
    Promise.all(
      fallbackCities.map((city) =>
        getEvents({ city, from: today.toISOString() })
      )
    )
      .then((results) => {
        const events = results
          .flatMap((result) => result.events || [])
          .sort((a, b) => new Date(a.date) - new Date(b.date));

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
              enCore tracks the artists you love and surfaces every gig worth knowing about.
            </p>
            <div className="hero-buttons">
              {isLoggedIn ? (
                <Link
                  to="/feed"
                  className="hero-btn-secondary"
                >
                  Browse events
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hero-btn-primary"
                >
                  Get started
                </Link>
              )}
            </div>
              </>
            }
        right={

          <img src={gradientLogo} alt="enCore logo" className="h-48"/>

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
