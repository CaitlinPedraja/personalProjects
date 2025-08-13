"use client";

import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';

interface TagsProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  priceRange: number[];
  setPriceRange: React.Dispatch<React.SetStateAction<number[]>>;
  ratingValue: number;
  setRatingValue: React.Dispatch<React.SetStateAction<number>>;
  colorsValue: string[];
  setColors: React.Dispatch<React.SetStateAction<string[]>>;
  handleAddFurniture: () => void;
}

function valuetext(value: number) {
  return `${value}`;
}

export default function Filter({ tags, setTags, priceRange, setPriceRange, ratingValue, setRatingValue, colorsValue, setColors, handleAddFurniture }: TagsProps) {
  const furnitureItems = [
    { title: 'Sofa' },
    { title: 'Table' },
    { title: 'Chair' },
    { title: 'Desk' },
  ];

  const colorItems = [
    'Red',
    'Orange',
    'Yellow',
    'Green',
    'Blue',
    'Purple',
    'Black',
    'Grey',
  ];

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 250,
      },
    },
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleColorChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setColors(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Box
      className="w-64 p-5 border border-gray-400 rounded-lg shadow-md space-y-6 flex flex-col gap-14 text-gray-700">
      <Stack spacing={1} sx={{ width: '100%' }}>
        <Autocomplete
          multiple
          freeSolo
          id="tags-outlined"
          options={furnitureItems.map((option) => option.title)}
          getOptionLabel={(option) => option}
          value={tags}
          onChange={(event, newValue) => {
            setTags(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add Keywords"
              placeholder=""
            />
          )}
        />
      </Stack>

      <Box sx={{ marginTop: '30px' }}>
        <Typography component="legend">Price Range</Typography>
        <Slider
          getAriaLabel={(index) => (index === 0 ? 'Minimum price' : 'Maximum price')}
          value={priceRange}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          getAriaValueText={valuetext}
          min={0}
          max={500}
        />
      </Box>

      <Box sx={{ marginTop: '30px' }}>
        <Typography component="legend">Seller's Rating</Typography>
        <Rating
          name="simple-controlled"
          value={ratingValue}
          onChange={(event, newValue) => {
            setRatingValue(newValue !== null ? newValue : 0);
          }} 
        />
      </Box>

      <Box sx={{ marginTop: '30px' }}>
        <FormControl sx={{ width: '100%' }}>
          <InputLabel id="demo-multiple-checkbox-label">Color</InputLabel>
          <Select
            labelId="demo-multiple-checkbox-label"
            id="demo-multiple-checkbox"
            multiple
            value={colorsValue}
            onChange={handleColorChange}
            input={<OutlinedInput label="Color" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
          >
            {colorItems.map((name) => (
              <MenuItem key={name} value={name}>
                <Checkbox checked={colorsValue.includes(name)} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Button variant="contained" onClick={handleAddFurniture} className="w-full py-3 text-base transition-transform duration-300 ease-in-out transform hover:scale-105">Add furniture</Button> 
      </Box>
    </Box>
  );
}
