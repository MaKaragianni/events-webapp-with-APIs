import LogoutButton from "./LogoutButton";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authClient } from "../services/authentication";
import pinkLogo from "../assets/logo-secondary.svg"


// need to make logout button dynamic (login / logout) checking session exists
// don't show profile to logged out

const navLinkClass = (isActive) =>
    `transition-colors ${
        isActive
            ? "text-primary-foreground font-semibold underline underline-offset-4"
            : "text-primary-foreground/70 hover:text-primary-foreground"
    }`;

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location

    const { data: session, isPending } = authClient.useSession();
    if (isPending) return null;

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-navbar">
            <Link to="/" className="font-heading text-xl text-primary-foreground tracking-tight">
                <img src={pinkLogo} alt="enCore Logo" className="h-8"/>
            </Link>

            <div className="flex items-center gap-6 text-sm">
                <Link to="/feed" className={navLinkClass(pathname === "/feed")}>
                    Events
                </Link>

                <Link to="/explore" className={navLinkClass(pathname === "/explore")}>
                    Map
                </Link>

                <Link to="/calendar" className={navLinkClass(pathname === "/calendar")}>
                    Calendar
                </Link>

                {session && (
                    <Link to="/profile" className={navLinkClass(pathname === "/profile")}>
                        Profile
                    </Link>
                )}

                {session ? (
                    <LogoutButton className="rounded-md border border-primary-foreground/20 px-5 py-2 text-primary-foreground font-medium hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-colors" />
                ) : (
                    <button
                        onClick={() => navigate("/login")}
                        className="rounded-md border border-primary-foreground/20 px-5 py-2 text-primary-foreground font-medium hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-colors"
                    >
                        Log in
                    </button>
                )}
            </div>
        </nav>
    )
}

export default NavBar;