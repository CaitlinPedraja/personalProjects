"use client";

import { Card, CardContent, CardMedia, Typography, Box, Grid, Button, IconButton, Rating, CircularProgress } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Maps from '../../components/map-card';
import { getCoordinatesOfAddress } from '../../utils'; 
import { useSession } from 'next-auth/react';
import { Swiper, SwiperSlide } from "swiper/react";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import "swiper/css";
import "swiper/css/navigation";
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


interface ColorData {
  colors: string[] | null;
}
 
interface FurnitureItem {
  id: number;
  user_id: number;
  price: number;
  description: string;
  condition: string;
  rating: number;
  location: string;
  colors: ColorData | null;
  pics: string[];
  name: string;
  favorite: boolean;
  approved?: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
  description: string;
}


const FurnitureDescriptionPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params['id'];
  const [locations, setLocations] = useState<Location[]>([]);
  const address = [''];
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);


  

  const [furnitureItem, setFurnitureItem] = useState<FurnitureItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const adminEmails = ["subletify@wustl.edu"]; 
      if (session?.user?.email && adminEmails.includes(session.user.email)) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [session]);

  useEffect(() => {
    console.log('furnitureItem', furnitureItem)
  }, [furnitureItem]);

  

  useEffect(() => {
    const user_id = session?.user.id;
    if (id) {

      const fetchFurnitureItem = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/furniture/${id}?user_id=${user_id}`);
          const data = await response.json();
          if (response.ok) {
            if (data.location) {
              const coords = await getCoordinatesOfAddress(data.location);
              if (coords) {
                setLocations([{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  description: data.description || "Furniture",
                }]);
              }
            }
            setFurnitureItem(data);
          } else {
            setError(`Error: ${response.status} - ${data.message}`);
          }
        } catch (error) {
          setError('Error fetching furniture item: ' + error);
        } finally {
          setLoading(false);
        }
      };
      fetchFurnitureItem();
    }
  }, [id]);

  if (loading)return <div><Box sx={{ position:'absolute', top:'50%', left:'50%'}}>
  <CircularProgress size='4rem'/>
</Box></div>;
  if (error) return <div>{error}</div>; 
  if (!furnitureItem) return <div>No furniture item found.</div>; 
  address.push(furnitureItem?.location);


  const colorList = Array.isArray(furnitureItem.colors)
    ? furnitureItem.colors.join(', ')
    : 'None';



  const handleContactLister = () => {
    if (status === 'unauthenticated') {
      const res = confirm("You must be logged in to contact the lister. Do you want to log in or sign up?");
      if (res) {
        router.push('/login'); 
      }
    } else {
      router.push(`/messages?recipientId=${furnitureItem?.user_id}&sellerId=${session?.user?.id}`);
    }
  };

  const toggleFavorite = (id: number) => {
    if (session){ 
      const updatedFavoriteStatus = !furnitureItem?.favorite;

      // Update the favorite status locally
      setFurnitureItem((prev) =>
        prev ? { ...prev, favorite: updatedFavoriteStatus } : null
      );
    fetch(`http://localhost:5001/api/furniture/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: session.user.id, listing_id: id, listing_type: "furniture", favorite: updatedFavoriteStatus}),
    });
  }else{
    const res = confirm("You must be logged in to heart a furniture listing. Do you want to log in or sign up?");
    if(res){
      router.push('/login'); 
    }
  }
  };

  const approveListing = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/furniture/${id}/approve`,
        {
          method: "PATCH",
        }
      );
      if (response.ok) {
        alert("Listing approved successfully!");

        const message_text = "Congrats! Your apartment listing " + furnitureItem.description + " has been approved."
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: furnitureItem.user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });

        setFurnitureItem((prev) =>
          prev ? { ...prev, approved: true } : prev // Update the local state to reflect the approval
        );
      } else {
        alert("Failed to approve the listing.");
      }
    } catch (error) {
      console.error("Error approving the listing:", error);
    }
  };

  const disapproveListing = async (reason:string) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/furniture/${id}/disapprove`,
        {
          method: "PATCH",
        }
      );
      if (response.ok) {

        const message_text = "Your furniture listing " + furnitureItem.description + " has not been approved. " +
        "\n" + "Reason: " + reason;
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: furnitureItem.user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });


        router.back();
      } else {
        alert("Failed to reject the listing.");
      }
    } catch (error) {
      console.error("Error reject the listing:", error);
    }
  };

  return (
    <Box sx={{maxWidth: '1350px', margin: '20px auto', height: '85vh', position: 'relative', overflow: 'hidden'}}>
      <Card
        sx={{
          boxShadow: 6,
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          padding: 4,
          gap: 4,
          height: '100%',
          position: 'relative',
          border: '1px solid',
          borderColor: 'rgb(209 213 219)',
        }}
      >
        {/* Left Arrow Button */}
        <IconButton
          onClick={() => router.back()}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10, // Ensure it stays on top of the card content
            backgroundColor: 'white',
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
  
        <Box sx={{ flex: 1, height: '100%', width: '50%' }}>
          {furnitureItem.pics.length > 1 ? (
            <Swiper
              spaceBetween={10}
              pagination={{ clickable: true }}
              modules={[Pagination]}
              className="h-full w-full"
            >
              {furnitureItem.pics.map((imageUrl, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={imageUrl}
                    alt={`Furniture Image ${index + 1}`}
                    className="h-full w-full object-cover rounded-md border border-gray-300"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={furnitureItem.pics[0]}
              alt="Furniture"
              className="h-full w-full object-cover rounded-md border border-gray-300"
            />
          )}
        </Box>
  
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto', 
          }}
        >
          {/* Furniture Info */}
          <CardContent sx={{ padding: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {furnitureItem.description}
              </Typography>
              <IconButton onClick={() => toggleFavorite(furnitureItem.id)}>
                {furnitureItem.favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
            <Box sx={{ marginTop: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ${furnitureItem.price}
              </Typography>
            </Box>
  
            <Typography variant="h6" color="text.secondary" sx={{ marginTop: 0}} className='text-lg'>
              Rating:
            </Typography>
            <Rating name="furniture-rating" value={furnitureItem.rating} readOnly />
  
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary" className='text-lg'>
                  Condition:
                </Typography>
                <Typography variant="body1">{furnitureItem.condition}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary" className='text-lg'>
                  Colors:
                </Typography>
                <Typography variant="body1">{colorList}</Typography>
              </Box>
              {locations.length > 0 ? (
                <Box sx={{ height: '200px', marginTop: '10px' }}>
                  <Maps locations={locations} names={address} />
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No pick-up location set
                </Typography>
              )}
            </Box>
  
            {/* Buttons */}
            <Box sx={{ display: 'flex', gap: '8px', marginTop: 1 }}>
              <Button
                className="bg-black p-3 rounded-3xl mt-3 w-1/2"
                variant="contained"
                onClick={() => router.push(`../profile?userId=${furnitureItem.user_id}`)}
              >
                View Seller's Profile
              </Button>
              <Button
                className="bg-black p-3 rounded-3xl mt-3 w-1/2"
                variant="contained"
                onClick={handleContactLister}
              >
                Contact Seller
              </Button>

            </Box>
          </CardContent>
  
          {/* Admin Approval */}
          {!furnitureItem.approved && isAdmin && (
            <Box sx={{ marginTop: 3, textAlign: 'center' }}>
              <Button variant="contained" color="success" onClick={approveListing} className="rounded-3xl p-3 w-1/2">
                Approve Listing
              </Button>
              <Button
            variant="contained"
            color="error"
            onClick={() => {
              const reason = prompt("Please provide a reason for the rejection:");
              if (reason) {
                disapproveListing(reason);
              } else {
                alert("Rejection reason is required.");
              }
            }}
            className="rounded-3xl p-3 w-1/2"
          >
            Reject Listing
          </Button>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default FurnitureDescriptionPage;