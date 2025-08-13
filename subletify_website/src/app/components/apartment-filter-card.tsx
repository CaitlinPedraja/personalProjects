"use client";

import * as React from 'react';
import { Dropdown } from '@mui/base/Dropdown';
import { Menu } from '@mui/base/Menu';
import Grid from '@mui/material/Grid2';
import { MenuButton as BaseMenuButton } from '@mui/base/MenuButton';
import { MenuItem as BaseMenuItem, menuItemClasses } from '@mui/base/MenuItem';
import { styled } from '@mui/system';
import Slider from '@mui/material/Slider';
import { Typography, MenuItem, Button } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';


interface FilterProps {
  priceRange: number[];
  setPriceRange: React.Dispatch<React.SetStateAction<number[]>>;
  distRange: number[];
  setDistRange: React.Dispatch<React.SetStateAction<number[]>>;
  bedrooms: string;
  setBedrooms: React.Dispatch<React.SetStateAction<string>>;
  bathrooms: string;
  setBathrooms: React.Dispatch<React.SetStateAction<string>>;
  handleAddApartment: () => void;
}

function valuetext(value: number) {
  return `${value}`;
}

export default function ApartmentFilter({ priceRange, setPriceRange, distRange, setDistRange, bedrooms, setBedrooms, bathrooms, setBathrooms, handleAddApartment }: FilterProps) {
  const handlePriceSliderChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleDistSliderChange = (event: Event, newValue: number | number[]) => {
    setDistRange(newValue as number[]);
  };

  const handleBedroomChange = (event: SelectChangeEvent) => {
    setBedrooms(event.target.value);
  };

  const handleBathroomChange = (event: SelectChangeEvent) => {
    setBathrooms(event.target.value);
  };

  return (
    <div className='border border-gray-300 mb-4'>

      <Grid container className="flex flex-row justify-center gap-4 gap-y-0 py-2">
      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel id="demo-select-small-label">Bedrooms</InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={bedrooms}
        label="Bedrooms"
        onChange={handleBedroomChange}
      >
        <MenuItem value={'Any'}>Any</MenuItem>
        <MenuItem value={'1'}>1</MenuItem>
        <MenuItem value={'2'}>2</MenuItem>
        <MenuItem value={'3'}>3</MenuItem>
        <MenuItem value={'4+'}>4+</MenuItem>
      </Select>
    </FormControl>

    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel id="demo-select-small-label">Bathrooms</InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={bathrooms}
        label="Bedrooms"
        onChange={handleBathroomChange}
      >
        <MenuItem value={'Any'}>Any</MenuItem>
        <MenuItem value={'1'}>1</MenuItem>
        <MenuItem value={'2'}>2</MenuItem>
        <MenuItem value={'3'}>3</MenuItem>
        <MenuItem value={'4+'}>4+</MenuItem>
      </Select>
    </FormControl>

        <Dropdown >
          <MenuButton>Distance</MenuButton>
          <Menu slots={{ listbox: Listbox }}>
          <Typography gutterBottom>Distance Range: {distRange[0]} - {distRange[1]} mile</Typography>
            <Slider
              getAriaLabel={(index) => (index === 0 ? 'Minimum Distance' : 'Maximum Distance')}
              value={distRange}
              onChange={handleDistSliderChange}
              getAriaValueText={valuetext}
              valueLabelDisplay="auto"
              min={0}
              max={3}
              step={0.1}
              style={{ margin: '15px', width: '90%' }} 
            />
          </Menu>
        </Dropdown>

        <Dropdown>
          <MenuButton>Price Range</MenuButton>
          <Menu slots={{ listbox: Listbox }}>
          <Typography gutterBottom>Price Range: ${priceRange[0]} - ${priceRange[1]}</Typography>
            <Slider
              getAriaLabel={(index) => (index === 0 ? 'Minimum Price' : 'Maximum Price')}
              value={priceRange}
              onChange={handlePriceSliderChange}
              getAriaValueText={valuetext}
              valueLabelDisplay="auto"
              min={0}
              max={5000}
              style={{ margin: '15px', width: '90%' }} 
            />
          </Menu>
        </Dropdown>
        <div style={{ display: 'flex', justifyContent: 'flex-end',  }}>
          <Button variant="contained" onClick={handleAddApartment} className="w-full py-2 text-base transition-transform duration-300 ease-in-out transform hover:scale-105 m-2">Add Listing</Button> 
        </div>
      </Grid>
    </div>
  );
}

//material ui code below

const FilterContainer = styled('div')`
  margin-left: 20px; /* Add space between filters */
`;

const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#99CCF3',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E6',
  700: '#0059B3',
  800: '#004C99',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const Listbox = styled('ul')(
  ({ theme }) => `
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    box-sizing: border-box;
    padding: 20px;
    margin: 12px 0;
    min-width: 250px;
    border-radius: 12px;
    overflow: hidden; /* Prevent scrolling */
    outline: 0;
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
    box-shadow: 0px 4px 6px ${
      theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
    };
    z-index: 1;
  `,
);


const MenuButton = styled(BaseMenuButton)(
  ({ theme }) => `
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 8px 16px;
    border-radius: 8px;
    color: white;
    transition: all 150ms ease;
    cursor: pointer;
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

    &:hover {
      background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
      border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    }

    &:active {
      background: ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
    }

    &:focus-visible {
      box-shadow: 0 0 0 4px ${theme.palette.mode === 'dark' ? blue[300] : blue[200]};
      outline: none;
    }
  `,
);
