import { GoogleMap, MarkerF, useJsApiLoader, InfoWindowF } from "@react-google-maps/api"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns"
import { MarkerClusterer } from "@googlemaps/markerclusterer"

function Map(props) {

    const [map, setMap] = useState(null)
    const [hovered, setHovered] = useState(null)
    const [selected, setSelected] = useState(null)

    const containerStyle = useMemo(() => ({
        width: props.width,
        height: props.height
    }), [props.width, props.height])

    const groupedByVenue = useMemo(() => {
        const map = {}
        props.events.filter(e => e.venue?.location?.coordinates).forEach(e => {
            const key = e.venue.location.coordinates.join(",")
            if (!map[key]) map[key] = { venue: e.venue, events: [] }
            map[key].events.push(e)
        })
        return Object.values(map)
    }, [props.events])


    useEffect(() => {
        if (!map || !props.events?.length) return
        const withCoords = props.events.filter(e => e.venue?.location?.coordinates)
        if (withCoords.length <= 1) return
        const bounds = new window.google.maps.LatLngBounds()
        withCoords.forEach(e => bounds.extend({
            lat: e.venue.location.coordinates[1],
            lng: e.venue.location.coordinates[0]
        }))
        map.fitBounds(bounds, 50)
    }, [map, props.events])

    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    })

    if (!isLoaded) return <p>Loading map...</p>


    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            onLoad={(m) => setMap(m)}
            zoom={props.zoom}
            center={props.centre}
            options={{
                mapId: "e9c25c7289259c03170ca2a6"
            }}
        >
            {props.events.filter((e) => e.venue?.location?.coordinates).map((e) => (
                <>
                    {groupedByVenue.map((group) => (
                        <MarkerF
                            key={group.venue.name}
                            position={{
                                lat: group.venue.location.coordinates[1],
                                lng: group.venue.location.coordinates[0]
                            }}
                            onClick={() => {
                              //  if (group.events.length === 1) {
                                //    navigate(`/events/${group.events[0]._id}`)
                               // } else {
                                    setSelected(group)
                                //}
                            }}
                        />
                    ))}

                    {selected && (
                        <InfoWindowF
                            position={{
                                lat: selected.venue.location.coordinates[1],
                                lng: selected.venue.location.coordinates[0]
                            }}
                            onCloseClick={() => setSelected(null)}
                            options={{ disableAutoPan: true, pixelOffset: new window.google.maps.Size(0, -35) }}
                        >
                            <div style={{ paddingTop: "15px" }}>
                                <strong>{selected.venue.name}</strong>
                                <div style={{ fontSize: "12px", color: "#666" }}>{selected.venue.address}</div>
                                <hr style={{ margin: "4px 0" }} />
                                {selected.events.map(e => (
                                    <div
                                        key={e._id}
                                        style={{ padding: "2px 0", cursor: "pointer" }}
                                        onClick={() => navigate(`/events/${e._id}`)}
                                        className="info-event-row"
                                    >
                                        <strong>{e.artist}</strong>
                                        <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>
                                            {format(e.date, "eeee d MMMM")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </InfoWindowF>
                    )}
                </>
            ))}
        </GoogleMap>
    )
}

export default Map