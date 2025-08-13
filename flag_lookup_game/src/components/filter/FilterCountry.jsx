

import React, { useState } from "react";

const FilterCountry = ({ onSelect }) => {
    const selectHandler = (regionName) => {
        onSelect(regionName);
      };
    
  return (
    <div className='filter_container'>
        <button className="option" onClick={() => selectHandler("All")}>
        All Countries
      </button>
      <button className="option" onClick={() => selectHandler("Africa")}>
        Africa
      </button>
      <button className="option" onClick={() => selectHandler("America")}>
        America
      </button>
      <button className="option" onClick={() => selectHandler("Asia")}>
        Asia
      </button>
      <button className="option" onClick={() => selectHandler("Europe")}>
        Europe
      </button>
      <button className="option" onClick={() => selectHandler("Oceania")}>
        Oceania
      </button>
      
    </div>
  );

}

export default FilterCountry