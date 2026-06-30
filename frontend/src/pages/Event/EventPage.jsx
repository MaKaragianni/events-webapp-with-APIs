import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEventById, getPurchaseLink } from "../../services/events";
import { addBooking } from "../../services/userProfile";
import { authClient } from "../../services/authentication";
import Footer from "../../components/Footer";
import NavBar from "../../components/NavBar";

import Map from "../../components/Map"

export function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingState, setBookingState] = useState("idle");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    getEventById(id)
      .then((data) => { setEvent(data.event) })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuyTickets = async () => {
    // Redirect to login if not authenticated
    if (!session) {
      navigate("/login");
      return;
    }

    if (bookingState === "booked" || bookingState === "already_booked") return;

    setBookingState("loading");

    try {
      // Record the booking
      await addBooking(id);
      setBookingState("booked");
      setShowConfirmation(true);
    } catch (err) {
      if (err.message === "already_booked") {
        setBookingState("already_booked");
        setShowConfirmation(true);
      } else {
        setBookingState("error");
      }
    }

    // Open the Ticketmaster page in a new tab
    try {
      const { ticketUrl } = await getPurchaseLink(id);
      if (ticketUrl) {
        window.open(ticketUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Redirection tracking error:", err);
    }
  };

  const isButtonDisabled =
    bookingState === "loading" ||
    bookingState === "booked" ||
    bookingState === "already_booked";

  const buttonLabel = () => {
    if (bookingState === "loading") return "Processing...";
    if (bookingState === "booked") return "Tickets Booked";
    if (bookingState === "already_booked") return "Already Booked";
    return "Buy Tickets";
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading event</p>;
  if (!event) return <p>Event not found</p>;

  return (
    <>
      <NavBar />
      {showConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Booking confirmation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
          >
            {bookingState === "already_booked" ? (
              <>
                <h2>Already Booked</h2>
                <p>You&apos;ve already booked tickets for <strong>{event.name}</strong>. Check your profile to view your bookings.</p>
              </>
            ) : (
              <>
                <h2>Booking Confirmed!</h2>
                <p>
                  <strong>{event.name}</strong> has been added to your bookings.
                  You can view it on your{" "}
                  <Link to="/profile">profile page</Link>.
                </p>
                <p>You&apos;re being redirected to Ticketmaster to complete your purchase.</p>
              </>
            )}
            <button
              onClick={() => setShowConfirmation(false)}
              style={{ marginTop: "1rem" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <h1>{event.name}</h1>
      <p>{event.artist}</p>
      <p>{event.genre}</p>
      <p>{event.city}</p>
      {event.description && <p className="event-description">{event.description}</p>}

      <button
        onClick={handleBuyTickets}
        disabled={isButtonDisabled}
        aria-label="Buy Tickets"
      >
        {buttonLabel()}
      </button>

      {bookingState === "error" && (
        <p role="alert">Something went wrong. Please try again.</p>
      )}
      <Map events={[event]} height={"60vh"} width={"100%"} zoom={18} centre={{ lat: event.venue.location.coordinates[1], lng: event.venue.location.coordinates[0] }} />
      <Footer />
    </>
  );
}