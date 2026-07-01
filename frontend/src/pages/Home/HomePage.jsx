import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./HomePage.css";
import Hero from "../../components/Hero";
import EventsBanner from "../../components/EventsBanner";
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
  const [homeCity, setHomeCity] = useState(null);
  const { data: session, isPending } = authClient.useSession();

  const fallbackCities = ["London", "Manchester", "Bristol", "Liverpool", "Glasgow"];

  useEffect(() => {
    if (!isPending && session?.user) {
      getMyProfile()
        .then(({ profile }) => {
          const city = profile.homeLocation?.city;
          setHomeCity(city || null);

          if (city) {
            return getEvents({ city }).then((data) => {
              setHomeEvents(data.events || []);
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
  const carouselTitle = homeEvents.length > 0
    ? `Popular near ${homeCity}`
    : "Popular across the UK";

  return (
    <div>
      <NavBar />
      <Hero right={"this is the right"} left={"this is the left"} />
      <EventsBanner />

      <EventCarousel
        title={carouselTitle}
        events={carouselEvents}
      />

      <SignUpBanner right={"sign up today"} left={"join the crowd"} />
      <Footer details={"these are some details"} />
    </div>
  );
}
