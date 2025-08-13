"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Typography, Container, Box } from '@mui/material';

const UpdatePassword = () => {
  
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params['token'];
  
  if (!token) {
    return <Typography variant="h6" color="error">Invalid or missing token</Typography>;
  }

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, 'Password should be at least 6 characters long')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
     
      try {
        const res = await fetch(`http://localhost:3000/api/user/reset-password`, { 
          method: "PATCH", 
          body: JSON.stringify({ token, newPassword: values.password }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          alert("Password has been reset successfully");
          formik.resetForm();
          router.push('/login');
        } else {
          const error = await res.json();
          alert(error.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while resetting the password.");
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            label="New Password"
            {...formik.getFieldProps('password')}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Reset Password
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default UpdatePassword;
