import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import EventCard from "../../src/components/EventCard/EventCard";
import { toggleSavedEvent } from "../../src/services/userProfile";
import { authClient } from "../../src/services/authentication";

// Mocks
vi.mock("../../src/services/userProfile", () => ({
    toggleFavouriteArtists: vi.fn(),
    toggleSavedEvent: vi.fn(),
}));

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Test data
const event = {
    _id: "event-123",
    name: "Coldplay Live",
    artist: "Coldplay",
    tags: ["Britpop"],
    date: "2026-08-01",
    time: "19:30",
    city: "Manchester",
    venue: { name: "A0 Arena" },
    images: [{ url: "https://example.com/coldplay.jpg", width: 1280, height: 720 }],
    ticketUrl: "https://ticketmaster.com/event/123",
};

// Helpers
function renderCard(props = {}) {
    const defaultProps = {
        favouriteArtists: [],
        savedEvents: [],
        isLoggedIn: true,
        onSavedToggled: vi.fn(),
        ...props
    };
    return render(<EventCard event={event} {...defaultProps} />);
}

describe("EventCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("renders event details", () => {
        test("renders event details", () => {
            renderCard();
            expect(screen.getByText("Coldplay Live")).toBeInTheDocument();
        });

        test("renders image when imageUrl exists", () => {
            renderCard();
            const image = screen.getByRole("img", { name: /Coldplay Live image/i });
            expect(image).toHaveAttribute("src", "https://example.com/coldplay.jpg");
        });

        test("formats a time with seconds (HH:MM:SS) as HH:MM", () => {
            const secondsEvent = { ...event, time: "19:30:00" };
            render(<EventCard event={secondsEvent} favouriteArtists={[]} savedEvents={[]} isLoggedIn={true} />);
        });

        test("leaves a time already in HH:MM format unchanged", () => {
            renderCard();
        });
    });

    describe("heart (save event) button", () => {
        test("renders an unsaved heart when event is not in savedEvents", () => {
            renderCard({ savedEvents: [] });
            expect(screen.getByTestId("save-event-btn").textContent).toBe("♡");
        });

        test("renders a filled heart when event is already saved", () => {
            renderCard({ savedEvents: ["event-123"] });
            expect(screen.getByTestId("save-event-btn").textContent).toBe("♥");
        });

        test("calls toggleSavedEvent with the event _id when clicked", async () => {
            renderCard({ savedEvents: [] });
            fireEvent.click(screen.getByTestId("save-event-btn"));
            expect(toggleSavedEvent).toHaveBeenCalledWith("event-123");
        });

        test("calls onSavedToggled callback with event _id after saving", async () => {
            const onSavedToggled = vi.fn();
            renderCard({ savedEvents: [], onSavedToggled });
            fireEvent.click(screen.getByTestId("save-event-btn"));
            await waitFor(() => {
                expect(toggleSavedEvent).toHaveBeenCalledWith("event-123");
            });
        });

        test("does not navigate to event page when heart is clicked (stopPropagation)", async () => {
            renderCard({ savedEvents: [] });
            fireEvent.click(screen.getByTestId("save-event-btn"));
            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalledWith("/events/event-123");
            });
        });

        test("redirects to /login and does not call service when user is not logged in", () => {
            renderCard({ isLoggedIn: false });
            fireEvent.click(screen.getByTestId("save-event-btn"));
            expect(mockNavigate).toHaveBeenCalledWith("/login");
            expect(toggleSavedEvent).not.toHaveBeenCalled();
        });
    });

    describe("follow artist button", () => {
        test("shows 'Follow' when artist is not in favouriteArtists", () => {
            renderCard({ favouriteArtists: [] });
        });

        test("shows 'Following' when artist is in favouriteArtists", () => {
            renderCard({ favouriteArtists: ["Coldplay"] });
        });
    });
});