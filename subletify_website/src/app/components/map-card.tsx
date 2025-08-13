import dynamic from 'next/dynamic';

const Maps = dynamic(() => import('../listings/Map'), { 
  ssr: false 
});

interface Location {
    latitude: number;
    longitude: number;
  }
  
 
  interface MapCardProps {
    locations: Location[]; 
    names: string[];
  }
  
  const MapCard: React.FC<MapCardProps> = ({ locations, names}) => {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <Maps locations={locations} names = {names} /> 
      </div>
    );
  };
export default MapCard;
