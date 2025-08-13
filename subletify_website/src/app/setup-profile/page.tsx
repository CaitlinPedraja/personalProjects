"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Container, Box, CircularProgress, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';

const SetupProfile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession(); // Get session data
  const email = session?.user?.email || '';
  

  const formik = useFormik({
    initialValues: {
      fullName: '',
      bio: '',
      email: email, // Prepopulate email if available
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      fullName: Yup.string().required('Full name is required'),
      bio: Yup.string().required('Bio is required, e.g. school year, interests, major'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await fetch('/api/user/update-profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        if (res.ok) {
          router.push('/furniture'); // Redirect after successful profile update
        } else {
          console.error('Error updating profile');
        }
      } catch (error) {
        console.error('Failed to submit form', error);
      }
      setLoading(false);
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        {/* Title */}
        <Typography
          variant="h5"
          sx={{ fontWeight: "semibold",fontSize:"1.75rem", color: "rgb(55, 65, 81)", mb: 2 }}
        >
          Setup Profile
        </Typography>
  
        <form onSubmit={formik.handleSubmit}>
          <TextField
            label="Email"
            fullWidth
            value={formik.values.email}
            disabled
            margin="normal"
          />
          <TextField
            label="Full Name"
            fullWidth
            {...formik.getFieldProps('fullName')}
            error={formik.touched.fullName && Boolean(formik.errors.fullName)}
            helperText={formik.touched.fullName && formik.errors.fullName}
            margin="normal"
          />
          <TextField
            label="Bio"
            fullWidth
            {...formik.getFieldProps('bio')}
            error={formik.touched.bio && Boolean(formik.errors.bio)}
            helperText={formik.touched.bio && formik.errors.bio}
            margin="normal"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="bg-black p-3 rounded-3xl mt-3 text-white"
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default SetupProfile;
