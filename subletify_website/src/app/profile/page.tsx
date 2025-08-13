"use client";


import { useSession } from 'next-auth/react';
import { Container, Typography, Box, CircularProgress, Grid, Tabs, Tab, CardMedia } from '@mui/material';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FurnitureCard from '../components/furniture-card';
import Link from 'next/link';
import { ApartmentCard } from '../components/apartment-card';




type UserProfile = {
  email: string;
  name: string | null;
  bio: string | null;
};


type FurnitureListing = {
  id: number;
  description: string;
  price: number;
  pics: string[];
  favorite: boolean;
  approved: boolean;
};


type ApartmentListing = {
  id: number;
  description: string;
  price: number;
  pics: string[];
  location: string;
  favorite: boolean;
  approved: boolean;

};




const ProfileContent = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<FurnitureListing[]>([]);
  const [apartmentListings, setApartmentListings] = useState<ApartmentListing[]>([]);
  const [favoriteFurnitureListings, setFavoriteFurnitureListings] = useState<FurnitureListing[]>([]);
  const [favoriteApartmentListings, setFavoriteApartmentListings] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  let userId = searchParams.get("userId");
  const [activeTab, setActiveTab] = useState(0);


  useEffect(() => {
    if (!session || !session.user) {
      router.push('/furniture');
      return;
    }

    fetchProfile();
    fetchListings();
    fetchApartmentListings();
    fetchFavoriteListings();
  }, [session]);

  useEffect(() => {
    console.log("FURNITURE", listings)
  }, [listings])

  async function fetchProfile() {
    let profile_id;
    if (userId) {
      profile_id = userId;
    }
    else if (session) {
      profile_id = session.user.id;
    }
    try {
      const response = await fetch(`/api/user/profile?id=${profile_id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        console.error("Failed to fetch profile data");

      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchListings() {
    let profile_id;
    if (userId) {
      profile_id = userId;
    }
    else if (session) {
      profile_id = session.user.id;
    }
    try {
      const listingsResponse = await fetch(`http://localhost:5001/api/furniture/mylistings/${profile_id}`);
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        setListings(listingsData);
      }

    }
    catch (error) {
      console.error("Error fetching listings", error)
    }
    finally {
      setLoading(false);
    }
  }

  async function fetchApartmentListings() {
    let profile_id;
    if (userId) {
      profile_id = userId;
    }
    else if (session) {
      profile_id = session.user.id;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/apartment/mylistings/${profile_id}`);
      if (response.ok) {
        const data = await response.json();
        setApartmentListings(data);
      }
    } catch (error) {
      console.error("Error fetching apartment listings", error);
    }
  }

  const fetchFavoriteListings = async () => {
    let profile_id;
    if (userId) {
      profile_id = userId;
    }
    else if (session) {
      profile_id = session.user.id;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/furniture?user_id=${profile_id}`);
      if (response.ok) {
        const data = await response.json();
        const fav = data.filter((item: { favorite: boolean; }) => item.favorite === true)
        setFavoriteFurnitureListings(fav);
      }
      const response1 = await fetch(`http://localhost:5001/api/apartment?user_id=${profile_id}`);
      if (response1.ok) {
        const data = await response1.json();
        const fav = data.filter((item: { favorite: boolean; }) => item.favorite === true)
        setFavoriteApartmentListings(fav);
      }

    } catch (error) {
      console.error("Error fetching favorite listings", error);
    }

  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };


  const toggleFavorite = async (id: number, type: 'furniture' | 'apartment', favorite: boolean) => {
    const updatedFavorite = !favorite;
    try {
      const res = await fetch(`http://localhost:5001/api/furniture/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session?.user.id,
          listing_id: id,
          listing_type: type,
          favorite: updatedFavorite,
        }),
      });

      if (res.ok) {

        fetchFavoriteListings();
        fetchApartmentListings();
        fetchListings();
      }
    } catch (error) {
      console.error("Error occurred while toggling favorite:", error);

    }
  };


  if (!session || !session.user) {
    return <Typography variant="h6">You must be logged in to view your profile.</Typography>;
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 5 }}>
      <Box className="flex flex-col gap-8 w-full min-h-screen">
        {/* Profile Card */}
        <Box className="flex flex-col justify-center items-center bg-gray-200 p-8 rounded-lg shadow-lg border border-gray-200 w-full max-w-3xlmx-auto " >
          <Typography variant="h4" component="h1" fontWeight="semibold" className="text-gray-700 text-center" sx={{ mb: 2 }}>
            {userId ? "Seller Profile" : "Your Profile"}
          </Typography>
          <Typography variant="body1" fontWeight="bold" className="text-gray-700 text-2xl text-center" sx={{ mt: 2 }}>
            {profile?.name || "Not provided"}
          </Typography>
          <Typography variant="h6" fontWeight="medium" className="text-gray-700 text-lg text-center" sx={{ mt: 2 }}>
            {profile?.email || "Not available"}
          </Typography>
          <Typography variant="body2" fontWeight="light" className="text-gray-700 text-base text-center mt-4">
            {profile?.bio || "Not provided"}
          </Typography>
        </Box>
  
        {/* Listings Section */}
        <Box>
          {userId ? (
            <>
              {/* Seller's Furniture Listings */}
              <Typography variant="h5" className="text-gray-700 font-bold" sx={{ mt: 2 }}>
                Seller's Furniture Listings
              </Typography>
              <Box sx={{ flexGrow: 1, mt: 2 }}>
                {listings.length > 0 ? (
                  <Grid container spacing={4}>
                    {listings.map((item) => (
                      <Grid item key={item.id} xs={6} sm={4} lg={3}>
                        <FurnitureCard
                          title={item.description}
                          price={`$${item.price}`}
                          images={item.pics || ["https://via.placeholder.com/345x140"]}
                          linkDestination={`/furniture/${item.id}`}
                          favorite={item.favorite}
                          onFavoriteToggle={() => toggleFavorite(item.id, "furniture", item.favorite)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" className="text-gray-700" sx={{ mt: 2 }}>
                    Seller has no furniture listings.
                  </Typography>
                )}
              </Box>
  
              {/* Seller's Apartment Listings */}
              <Typography variant="h5" className="text-gray-700 font-bold" sx={{ mt: 4 }}>
                Seller's Apartment Listings
              </Typography>
              <Box sx={{ flexGrow: 1, mt: 2 }}>
                {apartmentListings.length > 0 ? (
                  <Grid container spacing={4}>
                    {apartmentListings.map((item) => (
                      <Grid item key={item.id} xs={6} sm={4} lg={3}>
                        <ApartmentCard
                          title={item.description}
                          price={`$${item.price}`}
                          address={item.location}
                          images={item.pics || ["https://via.placeholder.com/345x140"]}
                          linkDestination={`/listings/${item.id}`}
                          favorite={item.favorite}
                          onFavoriteToggle={() => toggleFavorite(item.id, "apartment", item.favorite)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" className="text-gray-700" sx={{ mt: 2 }}>
                    Seller has no apartment listings.
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ mt: 4 }}>
                <Tabs value={activeTab} onChange={handleTabChange}  aria-label="Profile Listings Tabs" sx={{ '& .MuiTab-root': { fontSize: '1'} }}>
                  <Tab label="My Listings" />
                  <Tab label="Favorite Listings" />
                </Tabs>
  
                <Box sx={{ marginTop: "20px" }}>
                  {activeTab === 0 ? (
                    <>
                      <Typography variant="h5" className="text-gray-700 font-bold mb-4" sx={{ mt: 2 }}>
                        Your Furniture Listings
                      </Typography>
                      {listings.length > 0 ? (
                        <Grid container spacing={4} className=''>
                          {listings.map((item) => (
                            <Grid item key={item.id} xs={6} sm={4} lg={3}>
                              <FurnitureCard
                                title={item.description}
                                price={`$${item.price}`}
                                images={item.pics || ["https://via.placeholder.com/345x140"]}
                                linkDestination={`/furniture/edit/${item.id}`}
                                favorite={item.favorite}
                                onFavoriteToggle={() => toggleFavorite(item.id, "furniture", item.favorite)}
                                approved={item.approved}
                                showPendingLabel={true}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body1" className="text-gray-700" sx={{ mt: 2 }}>
                          You have no furniture listings.
                        </Typography>
                      )}
  
                      <Typography variant="h5" className="text-gray-700 font-bold mb-4" sx={{ mt: 4 }}>
                        Your Apartment Listings
                      </Typography>
                      {apartmentListings.length > 0 ? (
                        <Grid container spacing={4} className='mb-10'>
                          {apartmentListings.map((item) => (
                            <Grid item key={item.id} xs={6} sm={4} lg={3}>
                              <ApartmentCard
                                title={item.description}
                                price={`$${item.price}`}
                                address={item.location}
                                images={item.pics || ["https://via.placeholder.com/345x140"]}
                                linkDestination={`/listings/edit/${item.id}`}
                                favorite={item.favorite}
                                onFavoriteToggle={() => toggleFavorite(item.id, "apartment", item.favorite)}
                                approved={item.approved}
                                showPendingLabel={true}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body1" className="text-gray-700 mb-4" sx={{ mt: 2 }}>
                          You have no apartment listings.
                        </Typography>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="h5" className="text-gray-700 font-bold" sx={{ mt: 2 }}>
                        Your Favorite Furniture Listings
                      </Typography>
                      {favoriteFurnitureListings.length > 0 ? (
                        <Grid container spacing={4}>
                          {favoriteFurnitureListings.map((item) => (
                            <Grid item key={item.id} xs={6} sm={4} lg={3}>
                              <FurnitureCard
                                title={item.description}
                                price={`$${item.price}`}
                                images={item.pics || ["https://via.placeholder.com/345x140"]}
                                linkDestination={`/furniture/${item.id}`}
                                favorite={item.favorite}
                                onFavoriteToggle={() => toggleFavorite(item.id, "furniture", item.favorite)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body1" className="text-gray-700" sx={{ mt: 2 }}>
                          You have no favorite furniture listings.
                        </Typography>
                      )}
  
                      <Typography variant="h5" className="text-gray-700 font-bold" sx={{ mt: 4 }}>
                        Your Favorite Apartment Listings
                      </Typography>
                      {favoriteApartmentListings.length > 0 ? (
                        <Grid container spacing={4}>
                          {favoriteApartmentListings.map((item) => (
                            <Grid item key={item.id} xs={6} sm={4} lg={3}>
                              <ApartmentCard
                                title={item.description}
                                price={`$${item.price}`}
                                address={item.location}
                                images={item.pics || ["https://via.placeholder.com/345x140"]}
                                linkDestination={`/apartment/${item.id}`}
                                favorite={item.favorite}
                                onFavoriteToggle={() => toggleFavorite(item.id, "apartment", item.favorite)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body1" className="text-gray-700" sx={{ mt: 2 }}>
                          You have no favorite apartment listings.
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
  }  


const Profile = () => (
  <Suspense fallback={<CircularProgress />}>
    <ProfileContent />
  </Suspense>
);

export default Profile;