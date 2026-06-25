import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getEventById,
  getPurchaseLink
} from "../../services/events";

import { authClient } from "../../services/authentication";

export function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    getEventById(id)
      .then((data) => setEvent(data.event))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuyTickets = async () => {
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const data = await getPurchaseLink(id);

      window.location.href = data.ticketUrl;
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error loading event</p>;

  if (!event) return <p>Event not found</p>;

  return (
    <>
      <h1>{event.name}</h1>

      <p>{event.artist}</p>
      <p>{event.genre}</p>
      <p>{event.city}</p>

      {/* 
        NOTE FOR THE TEAM: The ticketmaster description is not yet provided by the API. 
        This conditional rendering ensures the UI is ready to display it safely 
        once the backend field becomes available without crashing the page in the meantime.
      */}
      {event.description && <p className="event-description">{event.description}</p>}

      <button onClick={handleBuyTickets}>
        Buy Tickets
      </button>
    </>
  );
}