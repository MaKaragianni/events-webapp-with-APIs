import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

import { FeedPage } from "../../src/pages/Feed/FeedPage";

vi.mock("../../src/components/NavBar", () => ({
    default: () => <nav data-testid="navbar-stub" />,
}));
vi.mock("../../src/components/Footer", () => ({
    default: () => <footer data-testid="footer-stub" />,
}));
vi.mock("../../src/components/Recommendations", () => ({
    default: () => <div data-testid="recommendations-stub" />,
}));
vi.mock("../../src/components/EventFeedSection", () => ({
    default: () => <div data-testid="event-feed-section-stub" />,
}));

vi.mock("../../src/services/authentication", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

vi.mock("../../src/services/userProfile", () => ({
    getMyProfile: vi.fn(),
    updateIsFirstLogin: vi.fn(),
    updateHomeLocation: vi.fn(),
}));

import { authClient } from "../../src/services/authentication";
import { getMyProfile } from "../../src/services/userProfile";

function renderFeedPage() {
    return render(
        <MemoryRouter>
            <FeedPage />
        </MemoryRouter>
    );
}

const popupText = /want to set a home city for personalized recommendations/i;

describe("FeedPage location pop-up", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("shows the location pop-up for a logged-in user who has never set a home location", async () => {
        authClient.useSession.mockReturnValue({ data: { user: { name: "Test" } }, isPending: false });
        getMyProfile.mockResolvedValue({
            profile: {
                isFirstLogin: true,
                hasSetHomeLocation: false,
                homeLocation: { city: "Manchester", lat: 53.483959, long: -2.244644 },
                favouriteArtists: [],
                savedEvents: [],
                bookings: [],
            },
        });

        renderFeedPage();

        expect(await screen.findByText(popupText)).toBeInTheDocument();
    });

    test("does not show the location pop-up for a returning user who already set a home location", async () => {
        authClient.useSession.mockReturnValue({ data: { user: { name: "Test" } }, isPending: false });
        getMyProfile.mockResolvedValue({
            profile: {
                isFirstLogin: true,
                hasSetHomeLocation: true,
                homeLocation: { city: "Manchester", lat: 53.483959, long: -2.244644 },
                favouriteArtists: [],
                savedEvents: [],
                bookings: [],
            },
        });

        renderFeedPage();

        await screen.findByTestId("event-feed-section-stub");
        expect(screen.queryByText(popupText)).not.toBeInTheDocument();
    });

    test("does not fetch a profile or show the pop-up for a logged-out visitor", async () => {
        authClient.useSession.mockReturnValue({ data: null, isPending: false });

        renderFeedPage();

        await screen.findByTestId("event-feed-section-stub");
        expect(getMyProfile).not.toHaveBeenCalled();
        expect(screen.queryByText(popupText)).not.toBeInTheDocument();
    });
});