import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
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
    images: [{ url: "https://example.com/coldplay.jpg" }],
    ticketUrl: "https://ticketmaster.com/event/123",
};

// Helpers

function renderCard(props = {}) {
    return render(<EventCard event={event} {...props} />);
}

// Tests

describe("EventCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authClient.useSession.mockReturnValue({ data: { user: { id: "u1" } } });
        toggleSavedEvent.mockResolvedValue({ profile: { savedEvents: ["event-123"] } });
    });

    describe("renders event details", () => {
        test("renders event details", () => {
            renderCard();

            expect(screen.getByText("Coldplay Live")).toBeTruthy();
            expect(screen.getByText("Coldplay")).toBeTruthy();
            expect(screen.getByText("Britpop")).toBeTruthy();
            expect(screen.getByText(/1 Aug 2026/)).toBeTruthy();
            expect(screen.getByText(/19:30/)).toBeTruthy();
            expect(screen.getByText(/A0 Arena.*Manchester/)).toBeTruthy();
        });

        test("renders image when imageUrl exists", () => {
            renderCard();

            const image = screen.getByRole("img", { name: /Coldplay Live image/i });
            expect(image.getAttribute("src")).toBe(event.images[0].url);
        });

        test("formats a time with seconds (HH:MM:SS) as HH:MM", () => {
            renderCard({ event: { ...event, time: "19:00:00" } });
 
            expect(screen.getByText(/19:00$/)).toBeTruthy();
            expect(screen.queryByText(/19:00:00/)).toBeNull();
        });
 
        test("leaves a time already in HH:MM format unchanged", () => {
            renderCard({ event: { ...event, time: "19:00" } });
 
            expect(screen.getByText(/19:00$/)).toBeTruthy();
        });

        test("renders nothing if event is missing", () => {
            const { container } = render(<EventCard event={null} />);
            expect(container.innerHTML).toBe("");
        });
    });

    describe("heart (save event) button", () => {
        test("renders an unsaved heart when event is not in savedEvents", () => {
            renderCard({ savedEvents: [] });

            const btn = screen.getByTestId("save-event-btn");
            expect(btn.textContent).toBe("♡");
            expect(btn.getAttribute("aria-label")).toBe("Save event");
        });

        test("renders a filled heart when event is already saved", () => {
            renderCard({ savedEvents: ["event-123"] });

            const btn = screen.getByTestId("save-event-btn");
            expect(btn.textContent).toBe("♥");
            expect(btn.getAttribute("aria-label")).toBe("Remove from saved events");
        });

        test("calls toggleSavedEvent with the event _id when clicked", async () => {
            renderCard({ savedEvents: [] });

            fireEvent.click(screen.getByTestId("save-event-btn"));

            await waitFor(() => {
                expect(toggleSavedEvent).toHaveBeenCalledWith("event-123");
            });
        });

        test("calls onSavedToggled callback with event _id after saving", async () => {
            const onSavedToggled = vi.fn();
            renderCard({ savedEvents: [], onSavedToggled });

            fireEvent.click(screen.getByTestId("save-event-btn"));

            await waitFor(() => {
                expect(onSavedToggled).toHaveBeenCalledWith("event-123");
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
            authClient.useSession.mockReturnValue({ data: null });
            renderCard({ savedEvents: [] });

            fireEvent.click(screen.getByTestId("save-event-btn"));

            expect(mockNavigate).toHaveBeenCalledWith("/login");
            expect(toggleSavedEvent).not.toHaveBeenCalled();
        });
    });

    describe("follow artist button", () => {
        test("shows 'Follow' when artist is not in favouriteArtists", () => {
            renderCard({ favouriteArtists: [] });
            expect(screen.getByTestId("follow-artist-btn").textContent).toBe("Follow");
        });

        test("shows 'Following' when artist is in favouriteArtists", () => {
            renderCard({ favouriteArtists: ["Coldplay"] });
            expect(screen.getByTestId("follow-artist-btn").textContent).toBe("Following");
        });
    });
});