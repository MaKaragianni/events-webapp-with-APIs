import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LoginPage } from "../../src/pages/Login/LoginPage"
import { authClient } from "../../src/services/authentication"
// Mock authClient
vi.mock("../../src/services/authentication", () => ({
  authClient: {
    signIn: {
      email: vi.fn()
    },
    signUp: {
      email: vi.fn()
    }
  }
}))
// Mock userProfile service (used for the optional home-city update on signup)
vi.mock("../../src/services/userProfile", () => ({
  updateHomeLocation: vi.fn()
}))
// Mock LocationSearch (Geoapify)
vi.mock("../../src/components/LocationSearch", () => ({
  default: () => <div data-testid="location-search-stub" />,
}))
// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})
describe("LoginPage", () => {
  beforeEach(() => {
    authClient.signIn.email.mockReset?.()
    authClient.signUp.email.mockReset?.()
  })
  test("renders login form by default", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText("Email")).toBeTruthy()
    expect(screen.getByPlaceholderText("Password")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Log in" })).toBeTruthy()
  })
  test("toggles to signup form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId("toggle-auth"))
    expect(screen.getByPlaceholderText("First name")).toBeTruthy()
    expect(screen.getByPlaceholderText("Last name")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy()
  })
  test("shows error message when login fails", async () => {
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials" }
    })
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" }
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpassword" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))  // ← fixed

    const error = await screen.findByText("Invalid credentials")
    expect(error).toBeTruthy()
  })
  test("calls signIn with email and password", async () => {
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@test.com" }
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password123"
    })
  })
  test("shows the confirm password field on the sign up form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId("toggle-auth"))
    expect(screen.getByPlaceholderText("Confirm password")).toBeTruthy()
  })

  test("combines first and last name into a single name on sign up", async () => {
    authClient.signUp.email.mockResolvedValue({ data: {}, error: null })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("toggle-auth"))
    fireEvent.change(screen.getByPlaceholderText("First name"), {
      target: { value: "Zein" }
    })
    fireEvent.change(screen.getByPlaceholderText("Last name"), {
      target: { value: "Smith" }
    })
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "zein@test.com" }
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" }
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "password123" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: "zein@test.com",
      password: "password123",
      name: "Zein Smith"
    })
  })

  test("shows an error and does not call signUp when passwords do not match", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByTestId("toggle-auth"))
    fireEvent.change(screen.getByPlaceholderText("First name"), {
      target: { value: "Zein" }
    })
    fireEvent.change(screen.getByPlaceholderText("Last name"), {
      target: { value: "Smith" }
    })
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "zein@test.com" }
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" }
    })
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "somethingElse" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    const error = await screen.findByText("Passwords do not match.")
    expect(error).toBeTruthy()
    expect(authClient.signUp.email).not.toHaveBeenCalled()
  })
})