import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from 'next/link';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IconButton from '@mui/material/IconButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import {CheckCircle, RemoveCircle} from '@mui/icons-material';

interface FurnitureCardProps {
  title: string;
  price: string;
  images: string[];
  linkDestination: string;
  favorite: boolean;
  onFavoriteToggle: () => void;
  approveListing?: () => void;
  showPendingLabel?: boolean;
  approved?: boolean;
  rejectListing?: () => void; 
}

const FurnitureCard = ({
  title,
  price,
  images,
  linkDestination,
  favorite,
  onFavoriteToggle,
  approveListing,
  showPendingLabel = false,
  approved,
  rejectListing,

}: FurnitureCardProps) => {

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFavoriteToggle();
  };
  console.log("CHECK HERE", approved)

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    approveListing?.();
  };
  const handleRejectListing = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    rejectListing?.();
  };

  return (
    <Link href={linkDestination} passHref>
      <Card className="w-full sm:w-52 md:w-60 lg:w-72 border border-gray-300 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
        {images.length > 1 ? (
          <Swiper
            spaceBetween={10}
            pagination={true}
            modules={[Pagination]}
            className="h-52 w-full"
          >
            {images.map((imageUrl, index) => (
              <SwiperSlide key={index}>
                <img
                  src={imageUrl}
                  alt={`${title} - Image ${index + 1}`}
                  className="h-52 w-full object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img
            src={images[0]}
            alt={title}
            className="h-52 w-full object-cover border-b border-gray-300"
          />

        )}
<CardContent className="relative flex flex-col px-4 py-2">
  {!approveListing && (
    <Box className="absolute top-2 right-4">
      <IconButton
        size="small"
        aria-label="toggle favorite"
        onClick={handleFavoriteClick}
      >
        {favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
      </IconButton>
    </Box>
  )}
  <Box className="flex items-start justify-between">
    <Typography
      gutterBottom
      variant="h5"
      component="div"
      className="text-left font-medium text-gray-800"
    >
      {title}
    </Typography>
    {!approveListing && (
      <IconButton
        size="small"
        className="ml-2"
        aria-label="toggle favorite"
        onClick={handleFavoriteClick}
      >
        {favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
      </IconButton>
    )}
  </Box>
  {showPendingLabel && (
    <Typography
      variant="body2"
      className={`font-semibold ${
        approved ? "text-green-600" : "text-red-600"
      }`}
    >
      {approved ? "Approved" : "Pending"}
    </Typography>
  )}
  <Box className="mt-2 flex justify-between">
    <Typography
      variant="h6"
      className="text-black text-lg font-semibold"
    >
      {price}
    </Typography>
    {approveListing && !approved && (
      <Box className="flex justify-end">
        <IconButton onClick={handleApproveClick}>
          <CheckCircle
            color="success"
            fontSize="large"
            className="text-green-600 hover:text-green-800"
          />
        </IconButton>
        <IconButton onClick={handleRejectListing}>
          <RemoveCircle
            color="error"
            fontSize="large"
            className="text-red-600 hover:text-red-800"
          />
        </IconButton>
      </Box>
    )}
  </Box>
</CardContent>

      </Card>
    </Link>
  );
}

export default FurnitureCard;
