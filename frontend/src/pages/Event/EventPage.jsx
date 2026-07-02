import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEventById, getPurchaseLink } from "../../services/events";
import { addBooking } from "../../services/userProfile";
import { authClient } from "../../services/authentication";
import Footer from "../../components/Footer";
import NavBar from "../../components/NavBar";
import { toggleFavouriteArtists, toggleSavedEvent } from "../../services/userProfile";
import Map from "../../components/Map"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner";
import { Bookmark, UserPlus, Tag, MapPin } from "lucide-react"
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";

export function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingState, setBookingState] = useState("idle");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isArtistFaved, setIsArtistFaved] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    getEventById(id)
      .then((data) => { setEvent(data.event) })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuyTickets = async () => {
    // Redirect to login if not authenticated
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    if (bookingState === "booked" || bookingState === "already_booked") return;

    setBookingState("loading");

    try {
      // Record the booking
      await addBooking(id);
      setBookingState("booked");
      setShowConfirmation(true);
      return;
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
        window.location.href = ticketUrl;
      }
    } catch {
      // Ticket URL fetch failing shouldn't block the confirmation
    }
  };

  async function handleSaveToFavourites(e) {
    e.stopPropagation();
    if (isPending) return;
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    const wasSaved = isSaved;
    try {
      await toggleSavedEvent(event._id);
      setIsSaved(!wasSaved);
      toast.success(
        wasSaved
          ? `${event.name} removed from favourites`
          : `${event.name} added to favourites`
      );
    } catch {
      toast.error("Failed to update favourites");
    }
  }

  async function handleSaveArtist(e) {
    e.stopPropagation();
    if (isPending) return;
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    const wasFaved = isArtistFaved;
    try {
      await toggleFavouriteArtists(event.artist);
      setIsArtistFaved(!wasFaved);
      toast.success(
        wasFaved
          ? `${event.artist} removed from favourite artists`
          : `${event.artist} added to favourite artists`
      );
    } catch {
      toast.error("Failed to update favourite artists");
    }
  }

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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "";
    return timeString.slice(0, 5); // takes "19:00" from "19:00:00"
  }

  return (
    <>
      <NavBar />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="self-start m-4"
      >
        <ArrowLeft /> Back
      </Button>
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <DialogHeader>
            <DialogTitle>Join enCore</DialogTitle>
            <DialogDescription>
              Create an account to start following artists, saving events,
              and booking tickets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={() => navigate("/login")}>
              Create Account
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")}>
              I already have an account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <DialogHeader>
            <DialogTitle>
              {bookingState === "already_booked"
                ? "Already Booked"
                : "Booking Confirmed!"}
            </DialogTitle>
            <DialogDescription asChild>
              {bookingState === "already_booked" ? (
                <p>
                  You&apos;ve already booked tickets for{" "}
                  <strong>{event.name}</strong>. Check your profile to view
                  your bookings.
                </p>
              ) : (
                <div>
                  <p>
                    <strong>{event.name}</strong> has been added to your
                    bookings. You can view it on your{" "}
                    <Link to="/profile" className="underline text-primary">
                      profile page
                    </Link>
                    .
                  </p>
                  <p className="mt-2">
                    You&apos;re being redirected to Ticketmaster to complete
                    your purchase.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="page items-start">
        <div className="event-mini sticky top-12 self-start">
          <img src={event.images[0].url} className="rounded object-cover" />
          <p className="font-bold text-3xl text-primary">{event.artist}</p>
          <div className="flex flex-row gap-3">
            {[... new Set(event.tags)].map((t) => <p key={t} className="flex flex-row gap-1 font-bold m-0 text-primary"><Tag />{t}</p>)}
          </div>
          <Separator />
          <div className="flex flex-row gap-2">
            <Button onClick={handleSaveArtist} disabled={isPending}><UserPlus /></Button>
            <Button onClick={handleSaveToFavourites} disabled={isPending}><Bookmark /></Button>
          </div>

        </div>
        <div className="event-details">
          <p className="text-5xl font-medium">{event.name}</p>
          <div className="flex flex-row gap-1">
            <MapPin />
            <p className="font-bold m-0 text-primary">{event.venue.name}</p>
          </div>
          <p className="font-semibold text-secondary">{formatDate(event.date)}, {formatTime(event.time)}</p>
          <div className="py-2">
            <Button
              onClick={handleBuyTickets}
              disabled={isButtonDisabled}
              aria-label="Buy Tickets"
            >
              {buttonLabel()}
            </Button>
          </div>
          {bookingState === "error" && (
            <p role="alert">Something went wrong. Please try again.</p>
          )}
          <p className="text-2xl font-semibold text-primary">Event Details</p>
          <Separator />
          {event.description.split(".").map((line) => (
            <p key={line[0]} className="text-l">{line}</p>
          ))}
          <div className="flex flex-col gap-2 pb-5 pt-5 text-primary">
            <p className="text-2xl font-semibold text-primary">Venue</p>
            <Separator />
            <p>{`Doors Open At: ${event.time}`}</p>
            <p>{event.venue.name}</p>
            <p>{event.venue.address}</p>
            <p>{event.venue.postcode}</p>
          </div>
          {event.venue.location &&
            <Map className="map" events={[event]} height={"60vh"} width={"100%"} zoom={18} centre={{ lat: event.venue.location?.coordinates[1], lng: event.venue.location?.coordinates[0] }} />
          }
        </div>
      </div>
      <Footer />
    </>
  );
}