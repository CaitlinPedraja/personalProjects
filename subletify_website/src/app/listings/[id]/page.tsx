"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Rating,
  CircularProgress,
} from "@mui/material";
import Maps from "../../components/map-card";
import { getCoordinatesOfAddress } from "../../utils";
import { useSession } from "next-auth/react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface ApartmentItem {
  id: number;
  user_id: number;
  price: number;
  location: string;
  amenities: string;
  description: string;
  availability: string;
  bedrooms: number;
  bathrooms: number;
  policies: string;
  pics: string[];
  rating: number;
  favorite: boolean;
  approved?: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
  description: string;
}

const ApartmentDescriptionPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params["id"];
  const [locations, setLocations] = useState<Location[]>([]);
  const address = [""];
  const { data: session, status } = useSession();
  const [apartmentItem, setApartmentItem] = useState<ApartmentItem | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const adminEmails = ["subletify@wustl.edu"];
      if (session?.user?.email && adminEmails.includes(session.user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [session]);

  useEffect(() => {
    if (id) {
      const fetchApartmentItem = async () => {
        try {
          const response = await fetch(
            `http://localhost:5001/api/apartment/${id}`
          );
          const data = await response.json();
          if (response.ok) {
            if (data.location) {
              const coords = await getCoordinatesOfAddress(data.location);
              if (coords) {
                setLocations([
                  {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    description: data.description || "Apartment",
                  },
                ]);
              }
            }
            setApartmentItem(data);
          } else {
            setError(`Error: ${response.status} - ${data.message}`);
          }
        } catch (error) {
          setError("Error fetching apartment item: " + error);
        } finally {
          setLoading(false);
        }
      };
      fetchApartmentItem();
    }
  }, [id]);

  if (loading)
    return (
      <Box sx={{ position: "absolute", top: "50%", left: "50%" }}>
        <CircularProgress size="4rem" />
      </Box>
    );
  if (error) return <div>{error}</div>;
  if (!apartmentItem) return <div>No apartment item found.</div>;
  address.push(apartmentItem?.location);

  const handleContactLister = () => {
    if (status === "unauthenticated") {
      const res = confirm(
        "You must be logged in to contact the lister. Do you want to log in or sign up?"
      );
      if (res) {
        router.push("/login");
      }
    } else {
      router.push(
        `/messages?recipientId=${apartmentItem?.user_id}&sellerId=${session?.user?.id}`
      );
    }
  };

  const toggleFavorite = (id: number) => {
    if (session) {
      const updatedFavoriteStatus = !apartmentItem?.favorite;

      setApartmentItem((prev) =>
        prev ? { ...prev, favorite: updatedFavoriteStatus } : null
      );
      fetch(`http://localhost:5001/api/furniture/${id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          listing_id: id,
          listing_type: "apartment",
          favorite: updatedFavoriteStatus,
        }),
      });
    } else {
      const res = confirm(
        "You must be logged in to heart an apartment listing. Do you want to log in or sign up?"
      );
      if (res) {
        router.push("/login");
      }
    }
  };


  const approveListing = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/apartment/${id}/approve`,
        {
          method: "PATCH",
        }
      );
      if (response.ok) {
        alert("Listing approved successfully!");

        const message_text = "Congrats! Your apartment listing " + apartmentItem.description + " has been approved."
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: apartmentItem.user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });

        setApartmentItem((prev) =>
          prev ? { ...prev, approved: true } : prev 
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
        `http://localhost:5001/api/apartment/${id}/disapprove`,
        {
          method: "PATCH",
        }
      );
      if (response.ok) {

        const message_text = "Your apartment listing " + apartmentItem.description + " has not been approved. \n Reason: " + reason;
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: apartmentItem.user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });

        setApartmentItem((prev) =>
          prev ? { ...prev, approved: true } : prev 
        );
        router.back();
      } else {
        alert("Failed to reject the listing.");
      }
    } catch (error) {
      console.error("Error reject the listing:", error);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "1350px",
        margin: "20px auto",
        height: "85vh",
        position: "relative",
        border: "1px solid",
        borderColor: "rgb(209 213 219)",
      }}
    >
      <Card
        sx={{
          boxShadow: 6,
          borderRadius: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          padding: 4,
          gap: 4,
          height: "100%",
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
            backgroundColor: "white",
            boxShadow: 3,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flex: 1, height: "100%", width: '50%' }}>
          {apartmentItem.pics.length > 1 ? (
            <Swiper
              spaceBetween={10}
              pagination={{ clickable: true }}
              modules={[Pagination]}
              className="h-full w-full"
            >
              {apartmentItem.pics.map((imageUrl, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={imageUrl}
                    alt={`Apartment Image ${index + 1}`}
                    className="h-full w-full object-cover rounded-md border border-gray-300"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={apartmentItem.pics[0]}
              alt="Apartment"
              className="h-full w-full object-cover rounded-md border border-gray-300"
            />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflowY: "auto",
          }}
        >
          <CardContent sx={{ padding: 0 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h4" sx={{ fontWeight: "semibold", fontSize: "1.75rem" }}>
                {apartmentItem.description}
              </Typography>
              <IconButton onClick={() => toggleFavorite(apartmentItem.id)}>
                {apartmentItem.favorite ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", fontSize: "1.25rem"}}>
              ${apartmentItem.price} / month
            </Typography>

            <Box sx={{ marginTop: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Rating:
              </Typography>
              <Rating name="apartment-rating" value={apartmentItem.rating} readOnly />
            </Box>

            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body1">
                Bedrooms: {apartmentItem.bedrooms}
              </Typography>
              <Typography variant="body1">
                Bathrooms: {apartmentItem.bathrooms}
              </Typography>
              <Typography variant="body1">Location: {apartmentItem.location}</Typography>
              <Typography variant="body1">
                Amenities: {apartmentItem.amenities}
              </Typography>
              <Typography variant="body1">
                Availability: {apartmentItem.availability}
              </Typography>
              <Typography variant="body1">Policies: {apartmentItem.policies}</Typography>
            </Box>

            {locations.length > 0 && (
              <Box sx={{ height: "200px", marginTop: 2 }}>
                <Maps locations={locations} names={address} />
              </Box>
            )}
          </CardContent>

          <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
            <Button
              className="bg-black p-3 rounded-3xl w-1/2"
              variant="contained"
              onClick={() => router.push(`../profile?userId=${apartmentItem.user_id}`)}
            >
              View Seller's Profile
            </Button>
            <Button
              className="bg-black p-3 rounded-3xl w-1/2"
              variant="contained"
              onClick={handleContactLister}
            >
              Contact Seller
            </Button>
          </Box>

          {!apartmentItem.approved && isAdmin && (
            <Box sx={{ marginTop: 3, textAlign: 'center' }}>
            <Button variant="contained" color="success" onClick={approveListing} className="rounded-3xl p-3 w-1/2">
              Approve Listing
            </Button>
            <Button
            variant="contained"
            color="error"
            onClick={() => {
              const reason = prompt("Please provide a reason for disapproval:");
              if (reason) {
                disapproveListing(reason);
              } else {
                alert("Disapproval reason is required.");
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

export default ApartmentDescriptionPage;
