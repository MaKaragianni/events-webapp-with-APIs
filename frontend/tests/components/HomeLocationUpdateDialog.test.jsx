import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import HomeLocationUpdateDialog from "../../src/components/HomeLocationUpdateDialog";

vi.mock("../../src/components/LocationSearch", () => ({
    default: ({ onCitySelect }) => (
        <button
            type="button"
            data-testid="location-search-stub"
            onClick={() => onCitySelect({ city: "Bristol", lat: 51.4545, lng: -2.5879 })}
        >
            Select Bristol
        </button>
    ),
}));

vi.mock("../../src/services/userProfile", () => ({
    updateIsFirstLogin: vi.fn(),
    updateHomeLocation: vi.fn(),
}));

import { updateIsFirstLogin, updateHomeLocation } from "../../src/services/userProfile";

function baseProfile(overrides = {}) {
    return {
        authUserId: "fakeUserId",
        isFirstLogin: true,
        hasSetHomeLocation: false,
        homeLocation: { city: "Manchester", lat: 53.483959, long: -2.244644 },
        ...overrides,
    };
}

describe("HomeLocationUpdateDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        updateIsFirstLogin.mockResolvedValue();
        updateHomeLocation.mockResolvedValue("Bristol");
    });

    test("shows the pop-up for a first-time user who has never set a home location", () => {
        render(<HomeLocationUpdateDialog profile={baseProfile()} />);

        expect(
            screen.getByText(/want to set a home city for personalized recommendations/i)
        ).toBeInTheDocument();
    });

    test("does not show the pop-up once the user has explicitly set a home location, even on the default Manchester value", () => {
        // homeLocation.city is always "Manchester" by default in the DB schema,
        // so hasSetHomeLocation - not homeLocation.city - must trigger the pop-up.
        render(
            <HomeLocationUpdateDialog
                profile={baseProfile({ hasSetHomeLocation: true })}
            />
        );

        expect(
            screen.queryByText(/want to set a home city for personalized recommendations/i)
        ).not.toBeInTheDocument();
    });

    test("does not show the pop-up once it's no longer the user's first login", () => {
        render(
            <HomeLocationUpdateDialog
                profile={baseProfile({ isFirstLogin: false, hasSetHomeLocation: false })}
            />
        );

        expect(
            screen.queryByText(/want to set a home city for personalized recommendations/i)
        ).not.toBeInTheDocument();
    });

    test("closing the pop-up marks first login as complete without requiring a location", async () => {
        const user = userEvent.setup();
        render(<HomeLocationUpdateDialog profile={baseProfile()} />);

        await user.click(screen.getByRole("button", { name: "Close" }));

        await waitFor(() => expect(updateIsFirstLogin).toHaveBeenCalled());
        await waitFor(() =>
            expect(
                screen.queryByText(/want to set a home city for personalized recommendations/i)
            ).not.toBeInTheDocument()
        );
    });

    test("submitting a location marks first login as complete and refreshes the profile", async () => {
        const setNewHomeLocation = vi.fn().mockResolvedValue();
        const user = userEvent.setup();
        render(
            <HomeLocationUpdateDialog
                profile={baseProfile()}
                setNewHomeLocation={setNewHomeLocation}
            />
        );

        await user.click(screen.getByTestId("location-search-stub"));
        await user.click(screen.getByRole("button", { name: "Update" }));

        await waitFor(() => expect(updateHomeLocation).toHaveBeenCalledWith({
            city: "Bristol",
            lat: 51.4545,
            long: -2.5879,
        }));
        await waitFor(() => expect(updateIsFirstLogin).toHaveBeenCalled());
        await waitFor(() => expect(setNewHomeLocation).toHaveBeenCalled());
    });
});