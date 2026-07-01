import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import Recommendations from "../../src/components/Recommendations";
import { toggleSavedEvent } from "../../src/services/userProfile";
import { authClient } from "../../src/services/authentication";

vi.mock("../../src/services/userProfile", () => ({
    toggleFavouriteArtists: vi.fn(),
    toggleSavedEvent: vi.fn(),
}));

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

const events = [
    {
        _id: "1",
        name: "Coldplay Live",
        artist: "Coldplay",
        tags: ["Pop"],
        date: "2026-08-01",
        time: "19:00:00",
        city: "Manchester",
        venue: { name: "AO Arena" },
        images: [{ url: "https://example.com/coldplay.jpg", width: 1280, height: 720 }],
    },
    {
        _id: "2",
        name: "Indie Night",
        artist: "Wet Leg",
        tags: ["Pop"],
        date: "2026-09-01",
        time: "20:00",
        city: "Leeds",
        venue: { name: "O2 Academy" },
        images: [{ url: "https://example.com/wetleg.jpg", width: 1280, height: 720 }],
    },
    {
        _id: "3",
        name: "Already Saved Show",
        artist: "Idles",
        tags: ["Pop"],
        date: "2026-10-01",
        time: "19:00",
        city: "London",
        venue: { name: "O2 Arena" },
        images: [{ url: "https://example.com/idles.jpg", width: 1280, height: 720 }],
    },
    {
        _id: "4",
        name: "Already Booked Show",
        artist: "Blur",
        tags: ["Pop"],
        date: "2026-11-01",
        time: "19:00",
        city: "Bristol",
        venue: { name: "O2 Academy" },
        images: [{ url: "https://example.com/blur.jpg", width: 1280, height: 720 }],
    },
];

function renderRecommendations(props = {}) {
    return render(
        <Recommendations
            favouriteArtists={[]}
            setFavouriteArtists={vi.fn()}
            savedEvents={[]}
            bookings={[]}
            onSavedToggled={vi.fn()}
            events={events}
            {...props}
        />
    );
}

describe("Recommendations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authClient.useSession.mockReturnValue({ data: { user: { id: "u1" } }, isPending: false });
        toggleSavedEvent.mockResolvedValue({ profile: { savedEvents: [] } });
    });

    test("prompts the user to engage when there is no activity", () => {
        renderRecommendations();
        expect(
            screen.getByText(/Save events or follow artists to see personalised recommendations/i)
        ).toBeInTheDocument();
    });

    test("recommends events matching genres of followed artists, excluding saved/booked events", () => {
        renderRecommendations({
            favouriteArtists: ["Coldplay"],
            savedEvents: [{ eventId: "3", tags: ["Pop"] }],
            bookings: ["4"],
        });

        // Coldplay Live itself isn't recommended again (it's the source event,
        // but recommendations only exclude saved/booked - so it can appear);
        // Indie Night shares the "Pop" tag and should be recommended.
        expect(screen.getByText("Indie Night")).toBeInTheDocument();
        // Already saved / already booked events must be excluded.
        expect(screen.queryByText("Already Saved Show")).not.toBeInTheDocument();
        expect(screen.queryByText("Already Booked Show")).not.toBeInTheDocument();
    });

    test("derives recommendation genres from saved event snapshots' tags", () => {
        renderRecommendations({
            savedEvents: [{ eventId: "3", tags: ["Pop"] }],
        });

        expect(screen.getByText("Indie Night")).toBeInTheDocument();
    });

    test("shows a message when activity exists but no new recommendations are available", () => {
        renderRecommendations({
            favouriteArtists: ["Coldplay"],
            savedEvents: [
                { eventId: "1", tags: ["Pop"] },
                { eventId: "2", tags: ["Pop"] },
                { eventId: "3", tags: ["Pop"] },
                { eventId: "4", tags: ["Pop"] },
            ],
            bookings: ["1", "2", "3", "4"],
        });

        expect(
            screen.getByText(/No new recommendations right now/i)
        ).toBeInTheDocument();
    });

    test("renders recommended event cards with the same image and HH:MM time formatting as the Feed page", () => {
        renderRecommendations({
            favouriteArtists: ["Coldplay"],
        });

        const image = screen.getByRole("img", { name: /Indie Night image/i });
        expect(image).toHaveAttribute("src", "https://example.com/wetleg.jpg");
        expect(image).toHaveClass("event-image");

        // Time should always render as HH:MM, even if the source had seconds.
        expect(screen.getByText(/20:00$/)).toBeInTheDocument();
    });
});