export default function EventFilters({
  city, from, to, tag,
  cities, topTags,
  onChange,
}) {
  return (
    <div className="filters">
      <section>
        <label>
          <select value={city} onChange={(e) => onChange("city", e.target.value)}>
            {cities.length === 0 && <option value="Manchester">Manchester</option>}
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="date" value={from} onChange={(e) => onChange("from", e.target.value)} />
        </label>

        <label>
          <input type="date" value={to} onChange={(e) => onChange("to", e.target.value)} />
        </label>
      </section>
      <section>
        {topTags.filter((t) => t !== "Undefined" && t!== "Other").map((tagName) => (
          <button
            key={tagName}
            onClick={() => onChange("tag", tag === tagName ? "" : tagName)}
          >
            {tagName}
          </button>
        ))}
      </section>
    </div>
  );
}