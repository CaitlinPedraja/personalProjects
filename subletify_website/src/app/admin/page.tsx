"use client";

import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import FurnitureCard from '../components/furniture-card';
import ApartmentCard from '../components/apartment-card'; 
import { useSession } from 'next-auth/react';

interface FurnitureItem {
  id: number;
  user_id: number;
  price: number;
  description: string;
  condition: string;
  colors: string[];
  pics: string[];
  favorite: boolean;
}

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
  favorite: boolean;
}

const AdminPage = () => {
  const [pendingFurniture, setPendingFurniture] = useState<FurnitureItem[]>([]);
  const [pendingApartments, setPendingApartments] = useState<ApartmentItem[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        // Fetch furniture listings
        const furnitureResponse = await fetch('http://localhost:5001/api/furniture/pending');
        const furnitureData = await furnitureResponse.json();
        setPendingFurniture(furnitureData);

        // Fetch apartment listings
        const apartmentResponse = await fetch('http://localhost:5001/api/apartment/pending');
        const apartmentData = await apartmentResponse.json();
        setPendingApartments(apartmentData);
      } catch (error) {
        console.error('Error fetching pending listings:', error);
      }
    };

    fetchPendingListings();
  }, []);

  const approveFurnitureListing = async (id: number, user_id: number, description: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/furniture/${id}/approve`, {
        method: 'PATCH',
      });

      if (response.ok) {
      
        const message_text = "Congrats! Your furniture listing " + description + " has been approved."
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });
        setPendingFurniture((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        console.error('Error approving furniture listing');
      }
    } catch (error) {
      console.error('Error approving furniture listing:', error);
    }
  };

  const approveApartmentListing = async (id: number, user_id: number, description: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/apartment/${id}/approve`, {
        method: 'PATCH',
      });

      if (response.ok) {
        
        const message_text = "Congrats! Your apartment listing " + description + " has been approved."
        const messageData = {
          sender_id: session?.user.id,
          recipient_id: user_id,
          message_text: message_text
        };

        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });
        setPendingApartments((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        console.error('Error approving apartment listing');
      }
    } catch (error) {
      console.error('Error approving apartment listing:', error);
    }
  };

  const rejectListing = async ( type:string, id: number, user_id: number, description: string) => {
    const reason = prompt("Please provide a reason for the rejection:");
    if (reason) {

      try {
        const response = await fetch(
          `http://localhost:5001/api/${type}/${id}/disapprove`,
          {
            method: "PATCH",
          }
        );
        if (response.ok) {
  
          const message_text = "Your furniture listing " + description + " has not been approved. " +
          "\n" + "Reason: " + reason;
          const messageData = {
            sender_id: session?.user.id,
            recipient_id: user_id,
            message_text: message_text
          };
  
  
          const response = await fetch('http://localhost:5001/api/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData),
          });
          setPendingApartments((prevItems) => prevItems.filter((item) => item.id !== id));
          setPendingFurniture((prevItems) => prevItems.filter((item) => item.id !== id));
        } else {
          alert("Failed to reject the listing.");
        }
      } catch (error) {
        console.error("Error reject the listing:", error);
      }
      


    } else {
      alert("Rejection reason is required.");
    } 
  };


  return (
    <div className="text-gray-700 p-6">
      <h2 className='text-2xl font-semibold mb-3 text-gray-700 flex ml-1 mt-6'>Pending Furniture Listings</h2>
      <Grid container spacing={4}>
        {pendingFurniture.map((item) => (
          <Grid item key={item.id} xs={6} sm={4} lg={3} className='mb-4'>
            <FurnitureCard 
              title={item.description}
              price={`$${item.price}`}
              images={
                item.pics && item.pics.length > 0
                  ? item.pics
                  : ["https://via.placeholder.com/345x140"]
              } 
              linkDestination={`/furniture/${item.id}`}
              favorite={item.favorite}
              onFavoriteToggle={() => {}}
              approveListing={() => approveFurnitureListing(item.id, item.user_id, item.description)}
              rejectListing={ () =>   rejectListing('furniture', item.id,item.user_id, item.description)}
            />
          </Grid>
        ))}
      </Grid>

      <h2 className='text-2xl font-semibold mb-3 text-gray-700 flex ml-1 mt-6'>Pending Apartment Listings</h2>
      <Grid container spacing={4}>
        {pendingApartments.map((item) => (
          <Grid item key={item.id} xs={6} sm={4} lg={3} className='mb-4'>
            <ApartmentCard
              title={item.description}
              address={item.location}
              price={`$${item.price}`}
              images={
                item.pics && item.pics.length > 0
                  ? item.pics
                  : ["https://via.placeholder.com/345x140"]
              }
              linkDestination={`/listings/${item.id}`}
              favorite={item.favorite}
              onFavoriteToggle={() => {}}
              approveListing={() => approveApartmentListing(item.id, item.user_id, item.description)}
              rejectListing={ () =>   rejectListing('apartment', item.id,item.user_id, item.description)}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default AdminPage;
