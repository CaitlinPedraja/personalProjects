import { SHA256 as sha256 } from "crypto-js"; 
export async function getCoordinatesOfAddress(address) {
  //const key = process.env.GEOCODING_API_KEY;

  //!!! need to add .env so api key isn't known !!!
  
  const queryString = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_API}`;

  try {
    const response = await fetch(queryString);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
        
      const { lat, lng } = data.results[0].geometry.location;
      
      return { latitude: lat, longitude: lng };
    } else {
      console.error('No results found for the address');
      return null;
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

export async function haversineDistance(lat1, lon1) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const lat2 = 38.648987;
  const lon2 = -90.312553; 
  const R = 3959;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  
  return distance;
}

export const hashPassword = (string) => {
  return sha256(string).toString();
};