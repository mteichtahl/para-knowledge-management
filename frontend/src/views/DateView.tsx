import React from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface Item {
  id: string
  bucket: string
  title: string
  description?: string
  status?: string
  extraFields?: Record<string, any>
  createdAt?: string
}

interface DateViewProps {
  items: Item[]
  bucketConfig: any
  calendarDate: Date
  calendarView: 'month' | 'week' | 'day' | 'quarter'
  setCalendarDate: (date: Date) => void
  setCalendarView: (view: 'month' | 'week' | 'day' | 'quarter') => void
  openEditPanel: (item: Item) => void
}

export const DateView: React.FC<DateViewProps> = ({
  items,
  bucketConfig,
  calendarDate,
  calendarView,
  setCalendarDate,
  setCalendarView,
  openEditPanel
}) => {
  const localizer = momentLocalizer(moment)
  
  moment.locale('en', {
    week: {
      dow: 0,
      doy: 1
    }
  })
  
  const events = items.map(item => {
    const startDate = item.extraFields?.startdate || item.extraFields?.startDate
    const endDate = item.extraFields?.deadline || item.extraFields?.enddate || item.extraFields?.endDate
    const singleDate = endDate || startDate
    
    if (singleDate) {
      return {
        id: item.id,
        title: item.title,
        start: new Date(startDate || singleDate),
        end: new Date(endDate || singleDate),
        resource: item,
        style: {
          backgroundColor: bucketConfig[item.bucket as keyof typeof bucketConfig]?.color,
          borderColor: bucketConfig[item.bucket as keyof typeof bucketConfig]?.color,
        }
      }
    }
    return null
  }).filter(Boolean)

  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
    const goToBack = () => {
      if (view === 'quarter') {
        onNavigate('PREV', moment(calendarDate).subtract(3, 'months').toDate())
      } else {
        onNavigate('PREV')
      }
    }
    
    const goToNext = () => {
      if (view === 'quarter') {
        onNavigate('NEXT', moment(calendarDate).add(3, 'months').toDate())
      } else {
        onNavigate('NEXT')
      }
    }
    
    const goToToday = () => {
      onNavigate('TODAY')
    }
    
    const getLabel = () => {
      if (view === 'quarter') {
        const quarter = Math.floor(moment(calendarDate).month() / 3) + 1
        return `Q${quarter} ${moment(calendarDate).year()}`
      }
      return label
    }
    
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={goToBack}>‹</button>
          <button type="button" onClick={goToToday}>Today</button>
          <button type="button" onClick={goToNext}>›</button>
        </span>
        <span className="rbc-toolbar-label">{getLabel()}</span>
        <span className="rbc-btn-group">
          <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>Month</button>
          <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>Week</button>
          <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>Day</button>
          <button type="button" className={view === 'quarter' ? 'rbc-active' : ''} onClick={() => onView('quarter')}>Quarter</button>
        </span>
      </div>
    )
  }

  const QuarterView = ({ date, localizer, events }: any) => {
    const startOfQuarter = moment(date).startOf('quarter').toDate()
    const months = []
    
    for (let i = 0; i < 3; i++) {
      const monthStart = moment(startOfQuarter).add(i, 'month').startOf('month')
      months.push({
        name: monthStart.format('MMMM'),
        start: monthStart.toDate(),
        end: monthStart.endOf('month').toDate()
      })
    }
    
    return (
      <div className="quarter-view">
        <div className="grid grid-cols-3 gap-4 h-full">
          {months.map((month, idx) => {
            const monthEvents = events.filter((event: any) => 
              moment(event.start).isBetween(month.start, month.end, 'day', '[]')
            )
            
            return (
              <div key={idx} className="border border-gray-200 rounded p-2">
                <h3 className="font-medium text-center mb-2">{month.name}</h3>
                <div className="space-y-1">
                  {monthEvents.slice(0, 10).map((event: any) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.style.backgroundColor }}
                      onClick={() => openEditPanel(event.resource)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {monthEvents.length > 10 && (
                    <div className="text-xs text-gray-500">+{monthEvents.length - 10} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  QuarterView.title = (date: Date) => {
    const quarter = Math.floor(moment(date).month() / 3) + 1
    return `Q${quarter} ${moment(date).year()}`
  }

  QuarterView.navigate = (date: Date, action: string) => {
    switch (action) {
      case 'PREV':
        return moment(date).subtract(3, 'months').toDate()
      case 'NEXT':
        return moment(date).add(3, 'months').toDate()
      case 'TODAY':
        return new Date()
      default:
        return date
    }
  }

  QuarterView.range = (date: Date) => {
    const start = moment(date).startOf('quarter').toDate()
    const end = moment(date).endOf('quarter').toDate()
    return { start, end }
  }
  
  return (
    <div className="h-screen">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={calendarDate}
        view={calendarView}
        onNavigate={setCalendarDate}
        onView={setCalendarView}
        onSelectEvent={(event) => openEditPanel(event.resource)}
        eventPropGetter={(event) => ({
          style: event.style
        })}
        views={{
          month: true,
          week: true,
          day: true,
          quarter: QuarterView
        }}
        components={{
          quarter: QuarterView,
          toolbar: CustomToolbar
        }}
      />
    </div>
  )
}
