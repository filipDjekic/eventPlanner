// src/pages/Organizer/NewEvent/NewEvent.jsx
import React, { useState } from 'react';
import BasicInfo from './BasicInfo';
import Tickets from './Tickets';

export default function NewEvent(){
  const [eventId, setEventId] = useState(null);
  const [capFromBasic, setCapFromBasic] = useState(null);
  const [infFromBasic, setInfFromBasic] = useState(false);
  

  return (
    <div className="ne-container">
      <h1 className="ne-title">Novi događaj</h1>
      <p className="ne-subtitle">Popuni osnovne informacije. Kada sačuvaš obavezna polja, automatski pravimo draft događaja.</p>

      <BasicInfo
        eventId={eventId}
        onEventId={(id) => setEventId(id)}
        onBasicInfoChange={({ capacity, infinite }) => {
          setCapFromBasic(capacity);
          setInfFromBasic(!!infinite);
        }}
      />
      <Tickets eventId={eventId} initialCapacity={capFromBasic} initialInfinite={infFromBasic} />

      {/* Sledeće podforme će se dodavati ispod, i dobiće eventId kada nastane */}
    </div>
  );
}
