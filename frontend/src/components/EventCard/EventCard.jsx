import { useNavigate } from "react-router-dom";
import { toggleSavedEvent } from "../../services/userProfile";
import { Bookmark } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
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

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

export default function EventCard({ event, isLoggedIn, savedEvents }) {
    const navigate = useNavigate();
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    function handleCardClick() {
        navigate(`/events/${event._id}`);
    }

    async function handleSaveToFavourites(e) {
        e.stopPropagation();
        if (!isLoggedIn) {
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

    function pickEventCardImage(images) {
        const targetRatio = 16 / 9;
        const minWidth = 640; // covers most card sizes at 2x density
        const sixteenNine = images
            .filter(img => Math.abs(img.width / img.height - targetRatio) < 0.05)
            .sort((a, b) => a.width - b.width);

        return (
            sixteenNine.find(img => img.width >= minWidth)
            ?? sixteenNine.at(-1)
            ?? images.sort((a, b) => b.width - a.width)[0]
        );
    }

    let sizes = event.images && event.images.length > 0 
    ? pickEventCardImage(event.images) 
    : null;

    return (
        <div
            className="event-card"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
            data-testid="event-card"
        >
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
            <div className="relative">
                {event.images && (
                    <img
                        src={sizes.url}
                        alt={`${event.name} image`}
                        className="w-full rounded aspect-square object-cover object-center"
                    />
                )}
                <Button
                    variant="default"
                    size="icon"
                    onClick={handleSaveToFavourites}
                    className="absolute bottom-2 right-2"
                >
                    <Bookmark />
                </Button>
            </div>
            <div className="event_body">
                <p className="font-bold text-l text--primary">{event.name}</p>
                <p className="text-sm text-secondary">{formatDate(event.date)} </p>
                <p className="text-sm text-primary">{event.venue?.name ? `${event.venue.name}` : ""}</p>
            </div>
        </div>
    );
}