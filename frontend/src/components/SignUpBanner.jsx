import { Link } from "react-router-dom";
import { authClient } from "../services/authentication";
import "./ui/SignUpBanner.css";

function SignUpBanner() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  return (
    <section className="signup-banner">
      <div>
        <h2>NEVER MISS A SHOW AGAIN</h2>
        <p>Follow artists, get notified the moment tickets drop.</p>
      </div>

      <Link
        to={isLoggedIn ? "/profile" : "/login"}
        className="signup-banner-button"
      >
        {isLoggedIn ? "Personalise my music" : "Create account"}
      </Link>
    </section>
  );
}

export default SignUpBanner;