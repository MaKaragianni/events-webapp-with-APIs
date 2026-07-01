import "./ui/Footer.css";
const teamMembers = [
  { name: "Joe Carroll", github: "https://github.com/jjcrl" },
  { name: "Kit Trowbridge", github: "https://github.com/Kit-Trowbridge" },
  { name: "Zein Rafie", github: "https://github.com/zeinrafie1-jpg" },
  { name: "Coral Han", github: "https://github.com/cosmicoral" },
  { name: "Maria Karagianni", github: "https://github.com/MaKaragianni" },
];

function Footer() {
  const scrollingMembers = [...teamMembers, ...teamMembers];

  return (
      <footer className="footer">
      <a
        className="footer-repo"
        href="https://github.com/jjcrl/events-webapp"
        target="_blank"
        rel="noreferrer"
      >
        🌍 Project Repository
      </a>
      <div className="footer-brand">
        <span className="footer-logo">En<span>Core</span></span>
        <p>© 2026 EnCore. Built at Makers Academy</p>
      </div>

      <div className="footer-team">
        <p className="footer-team-title">Our Team</p>

        <div className="footer-team-marquee">
          <ul>
            {scrollingMembers.map((member, index) => (
              <li key={`${member.name}-${index}`}>
              <a
              href={member.github}
              target="_blank"
              rel="noreferrer"
            >
              {member.name}
              <span className="footer-icon">🔗</span>
</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;