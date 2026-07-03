import React from 'react'
import { useState, useEffect } from 'react'
import { getEvents } from "../../services/events"
import { getMyProfile } from '../../services/userProfile'
import NavBar from "../../components/NavBar"
import Footer from '../../components/Footer'
import { useNavigate } from 'react-router-dom'
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

const DAY_LABELS = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']

function localKey(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function buildRollingGrid(events, startDate, weeks = 5) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const totalDays = weeks * 7

    const eventsByDate = {}
    for (const event of events) {
        const key = localKey(new Date(event.date))
        if (!eventsByDate[key]) eventsByDate[key] = []
        eventsByDate[key].push(event)
    }

    const cells = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        const key = localKey(date)
        const isToday = key === localKey(new Date())

        return {
            date,
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }),
            isFirstOfMonth: date.getDate() === 1,
            isToday,
            events: eventsByDate[key] || []
        }
    })

    return { cells }
}

function CalendarPage() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState({})
    const today = new Date()
    const weeks = 5
    const navigate = useNavigate()

    const { cells } = buildRollingGrid(events, today, weeks)

    useEffect(() => {
        const from = new Date()
        from.setHours(0, 0, 0, 0)
        const to = new Date(from)
        to.setDate(from.getDate() + weeks * 7 - 1)
        to.setHours(23, 59, 59, 999)
        getMyProfile()
            .then(async ({ profile }) => {
                setProfile(profile)
                const { events } = await getEvents({
                    city: profile.homeLocation.city || "Manchester",
                    from: from,
                    to: to,
                    limit: 0
                })
                return setEvents(events)
            })
            .catch((e) => console.log(e))
            .finally(() => setLoading(false))
    }, [])


    return (
        <div className="flex flex-col h-screen w-screen">
            <NavBar />
            <div className="flex-1 flex flex-col min-h-dvh">
                        <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-hidden">
                            {loading
                                ? Array.from({ length: 35 }, (_, i) => (
                                    <div key={i} className="border border-border p-2">
                                        <Skeleton className="h-4 w-6 mb-2" />
                                        <Skeleton className="h-5 w-20 mb-1" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                ))
                                : cells.map((cell, i) => (
                                    <div
                                        key={i}
                                        className={`min-h-0 overflow-hidden  border border-border p-2 flex flex-col ${cell.isToday ? 'bg-accent/40' : ''
                                            }`}
                                    >
                                        <span className={`text-xs font-medium block mb-1 ${cell.isToday
                                            ? 'text-primary font-bold'
                                            : cell.isFirstOfMonth
                                                ? 'text-destructive font-semibold'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {cell.isFirstOfMonth ? `${cell.month} ${cell.day}` : cell.day}
                                        </span>

                                        <ScrollArea className="flex-1 min-h-0">
                                            <div className="flex flex-col gap-1 pr-2">
                                                {cell.events.map(event => (
                                                    <HoverCard key={event._id} openDelay={200} closeDelay={100}>
                                                        <HoverCardTrigger asChild>
                                                            <div
                                                                className="cursor-pointer"
                                                                onClick={() => navigate(`/events/${event._id}`)}
                                                            >
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs w-full justify-start truncate font-normal"
                                                                >
                                                                    {event.artist}
                                                                </Badge>
                                                            </div>
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-64" side="right">
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm font-semibold">{event.artist}</p>
                                                                <img src={event.images[0].url} className='rounded'/>
                                                                {event.venue.name && (
                                                                    <p className="text-xs text-muted-foreground">{event.venue.name}</p>
                                                                )}
                                                                {event.date && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(event.date).toLocaleString('default', {
                                                                            weekday: 'short',
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </p>
                                                                )}
                                                                {event.genre && (
                                                                    <Badge variant="outline" className="text-xs mt-1">
                                                                        {event.genre}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                ))
                            }
                        </div>
            </div>
            <Footer />
        </div>
    )
}

export default CalendarPage