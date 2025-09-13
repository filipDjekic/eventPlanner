// src/pages/Organizer/NewEvent/NewEvent.jsx
import React, { useState } from 'react';
import BasicInfo from './BasicInfo';

export default function NewEvent(){
  const [eventId, setEventId] = useState(null);

  return (
    <div className="ne-container">
      <h1 className="ne-title">Novi događaj</h1>
      <p className="ne-subtitle">Popuni osnovne informacije. Kada sačuvaš obavezna polja, automatski pravimo draft događaja.</p>

      <BasicInfo
        eventId={eventId}
        onEventId={(id) => setEventId(id)}
      />

      {/* Sledeće podforme će se dodavati ispod, i dobiće eventId kada nastane */}
    </div>
  );
}
